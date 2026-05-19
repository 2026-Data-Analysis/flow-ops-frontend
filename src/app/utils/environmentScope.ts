import type { ApiInventoryResponse, EnvironmentResponse } from '../api/flowOpsClient';

const normalize = (value?: string | number | null) => String(value ?? '').trim().toLowerCase();

const branchAliases = (environment: EnvironmentResponse) => {
  const labels = [environment.branchName, environment.name].map(normalize).filter(Boolean);
  const aliases = new Set(labels);

  if (labels.some((label) => label.includes('prod') || label === 'main' || label === 'master')) {
    aliases.add('prod');
    aliases.add('production');
    aliases.add('main');
    aliases.add('master');
  }
  if (labels.some((label) => label.includes('stag'))) {
    aliases.add('stage');
    aliases.add('staging');
  }
  if (labels.some((label) => label.includes('dev') || label.includes('develop'))) {
    aliases.add('dev');
    aliases.add('develop');
    aliases.add('development');
  }

  return aliases;
};

export const inventoryQueryParamsForEnvironment = (environment: EnvironmentResponse | null) =>
  environment
    ? {
        repositoryId: environment.repositoryId,
        branchName: environment.branchName,
      }
    : {};

export const inventoryBelongsToEnvironment = (
  inventory: ApiInventoryResponse,
  environment: EnvironmentResponse | null,
  repositoryId?: number | null,
) => {
  const scopedRepositoryId = environment?.repositoryId ?? repositoryId;
  if (scopedRepositoryId && inventory.repositoryId && inventory.repositoryId !== scopedRepositoryId) {
    return false;
  }

  if (!environment) return true;

  const inventoryBranch = normalize(inventory.branchName);
  const aliases = branchAliases(environment);
  if (inventoryBranch && aliases.size > 0 && !aliases.has(inventoryBranch)) {
    return false;
  }

  return true;
};

export const filterInventoryForEnvironment = (
  items: ApiInventoryResponse[],
  environment: EnvironmentResponse | null,
  repositoryId?: number | null,
) => items.filter((item) => inventoryBelongsToEnvironment(item, environment, repositoryId));

export const inventoryQueryParamsForScope = (
  environment: EnvironmentResponse | null,
  repositoryId?: number | null,
) => {
  const params = inventoryQueryParamsForEnvironment(environment);
  const scopedRepositoryId = params.repositoryId ?? repositoryId;
  return {
    ...params,
    ...(scopedRepositoryId ? { repositoryId: scopedRepositoryId } : {}),
  };
};
