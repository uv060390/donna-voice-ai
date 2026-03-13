import { ClientConfig } from "../types/ClientConfig";
import { logger } from "../utils/logger";

export interface RailwayResult {
  railwayProjectId: string;
  railwayServiceId: string;
  deployedUrl: string;
}

const RAILWAY_API = "https://backboard.railway.app/graphql/v2";

async function gql(query: string, variables: Record<string, unknown>, token: string) {
  const res = await fetch(RAILWAY_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`Railway API error: ${res.status} ${await res.text()}`);
  }
  const { data, errors } = await res.json();
  if (errors?.length) {
    throw new Error(`Railway GraphQL error: ${JSON.stringify(errors)}`);
  }
  return data;
}

async function pollDeployment(
  serviceId: string,
  token: string,
  maxWaitMs = 300_000
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const data = await gql(
      `query($serviceId: String!) {
         service(id: $serviceId) {
           deployments(first: 1) {
             edges { node { status url } }
           }
         }
       }`,
      { serviceId },
      token
    );
    const deployment = data?.service?.deployments?.edges?.[0]?.node;
    if (deployment?.status === "SUCCESS") {
      return deployment.url;
    }
    if (deployment?.status === "FAILED" || deployment?.status === "CRASHED") {
      throw new Error(`Deployment failed with status: ${deployment.status}`);
    }
    logger.info(`Deployment status: ${deployment?.status ?? "pending"} — waiting...`);
    await new Promise((r) => setTimeout(r, 10_000));
  }
  throw new Error("Deployment timed out after 5 minutes");
}

export async function provisionRailway(
  config: ClientConfig,
  envVars: Record<string, string>
): Promise<RailwayResult> {
  // Idempotent: skip if already provisioned
  if (config.provisioned?.railwayProjectId) {
    logger.skip(`Railway already provisioned (${config.provisioned.deployedUrl})`);
    return {
      railwayProjectId: config.provisioned.railwayProjectId,
      railwayServiceId: config.provisioned.railwayServiceId!,
      deployedUrl: config.provisioned.deployedUrl!,
    };
  }

  const token = process.env.RAILWAY_API_TOKEN;
  const repoUrl =
    process.env.RAILWAY_GITHUB_REPO ?? "https://github.com/donna-associates/donna-app";
  const teamId = process.env.RAILWAY_TEAM_ID;

  if (!token) throw new Error("RAILWAY_API_TOKEN env var required");

  // Create project
  logger.step(`Creating Railway project for ${config.clientId}...`);
  const projectData = await gql(
    `mutation($name: String!, $teamId: String) {
       projectCreate(input: { name: $name, teamId: $teamId }) { id }
     }`,
    { name: `donna-${config.clientId}`, teamId: teamId ?? null },
    token
  );
  const projectId = projectData.projectCreate.id;
  logger.success(`Railway project created: ${projectId}`);

  // Add Postgres plugin
  logger.step("Adding Postgres plugin...");
  await gql(
    `mutation($projectId: String!, $name: String!) {
       pluginCreate(input: { projectId: $projectId, name: $name, friendlyName: $name }) { id }
     }`,
    { projectId, name: "postgresql" },
    token
  );

  // Get DATABASE_URL from plugin (give it a moment to provision)
  await new Promise((r) => setTimeout(r, 5_000));
  const pluginData = await gql(
    `query($id: String!) {
       project(id: $id) {
         plugins { edges { node { id variables { edges { node { name value } } } } } }
       }
     }`,
    { id: projectId },
    token
  );
  const pluginVars: Record<string, string> = {};
  for (const edge of pluginData?.project?.plugins?.edges ?? []) {
    for (const varEdge of edge.node.variables?.edges ?? []) {
      pluginVars[varEdge.node.name] = varEdge.node.value;
    }
  }
  const databaseUrl = pluginVars["DATABASE_URL"] ?? pluginVars["PGURL"] ?? "";
  logger.success("Postgres provisioned");

  // Create service from GitHub repo
  logger.step("Creating web service from GitHub repo...");
  const serviceData = await gql(
    `mutation($projectId: String!, $source: ServiceSourceInput!) {
       serviceCreate(input: { projectId: $projectId, source: $source }) { id }
     }`,
    {
      projectId,
      source: { repo: repoUrl },
    },
    token
  );
  const serviceId = serviceData.serviceCreate.id;
  logger.success(`Service created: ${serviceId}`);

  // Upsert all env vars
  logger.step("Upserting environment variables...");
  const allEnvVars = {
    ...envVars,
    DATABASE_URL: databaseUrl,
    CLIENT_ID: config.clientId,
    NEXTAUTH_URL: `https://${config.clientId}.up.railway.app`,
  };

  for (const [name, value] of Object.entries(allEnvVars)) {
    if (!value) continue;
    await gql(
      `mutation($serviceId: String!, $name: String!, $value: String!) {
         variableUpsert(input: { serviceId: $serviceId, name: $name, value: $value })
       }`,
      { serviceId, name, value },
      token
    );
  }
  logger.success(`${Object.keys(allEnvVars).length} env vars set`);

  // Trigger deployment
  logger.step("Triggering deployment...");
  await gql(
    `mutation($serviceId: String!) {
       serviceInstanceRedeploy(serviceId: $serviceId)
     }`,
    { serviceId },
    token
  );

  // Poll until SUCCESS
  logger.step("Waiting for deployment to complete...");
  const deployedUrl = await pollDeployment(serviceId, token);
  logger.success(`Deployment live at: ${deployedUrl}`);

  // Health check
  logger.step("Running health check...");
  const healthRes = await fetch(`${deployedUrl}/api/health`).catch(() => null);
  if (!healthRes?.ok) {
    logger.warn("Health check failed — deployment may still be warming up");
  } else {
    logger.success("Health check passed");
  }

  return { railwayProjectId: projectId, railwayServiceId: serviceId, deployedUrl };
}
