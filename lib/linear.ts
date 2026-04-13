/**
 * Linear API client — server-side only
 * 
 * Usage:
 *   const user = await fetchLinear(query, variables);
 * 
 * This uses GraphQL API with your Linear API key (NOT OAuth).
 */

import { getLinearApiKey } from "@/lib/config";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: object }>;
}

/**
 * Make a GraphQL request to Linear API
 * @param query - GraphQL query string
 * @param variables - GraphQL variables object
 * @returns Parsed response data
 */
export async function fetchLinear<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  // Linear API keys must be passed directly — no "Bearer" prefix
  const apiKey = getLinearApiKey();

  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Linear API error: ${response.status} ${response.statusText}`);
  }

  const result: GraphQLResponse<T> = JSON.parse(responseText);

  if (result.errors && result.errors.length > 0) {
    throw new Error(`Linear GraphQL error: ${result.errors.map((e) => e.message).join(", ")}`);
  }

  if (!result.data) {
    throw new Error("Linear API returned no data");
  }

  return result.data;
}

/**
 * Get current authenticated user info from Linear
 * 
 * @returns User object with id, email, name, etc.
 */
export async function getLinearUser() {
  const query = `
    query {
      viewer {
        id
        email
        displayName
        name
      }
    }
  `;

  const result = await fetchLinear<{
    viewer: {
      id: string;
      email: string;
      displayName: string;
      name: string;
    };
  }>(query);

  return result.viewer;
}

/**
 * Get a specific issue from Linear
 * 
 * @param issueId - Issue ID or identifier (e.g., "LIN-123")
 * @returns Issue object
 */
export async function getLinearIssue(issueId: string) {
  const query = `
    query GetIssue($id: String!) {
      issue(id: $id) {
        id
        identifier
        title
        description
        priority
        state {
          name
        }
        assignee {
          id
          displayName
        }
        createdAt
        updatedAt
      }
    }
  `;

  const result = await fetchLinear<{
    issue: {
      id: string;
      identifier: string;
      title: string;
      description: string;
      priority: number;
      state: { name: string };
      assignee: { id: string; displayName: string } | null;
      createdAt: string;
      updatedAt: string;
    };
  }>(query, { id: issueId });

  return result.issue;
}
