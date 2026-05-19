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

export const findDefaultBranchEnvironment = (
  environments: EnvironmentResponse[],
  defaultBranch?: string | null,
) => {
  const normalizedDefaultBranch = normalize(defaultBranch);
  if (normalizedDefaultBranch) {
    const exactDefault = environments.find((environment) =>
      [environment.branchName, environment.name].map(normalize).includes(normalizedDefaultBranch),
    );
    if (exactDefault) return exactDefault;
  }

  return (
    environments.find((environment) => [environment.branchName, environment.name].map(normalize).includes('main')) ||
    environments.find((environment) => [environment.branchName, environment.name].map(normalize).includes('master')) ||
    environments.find((environment) => branchAliases(environment).has('production')) ||
    environments[0] ||
    null
  );
};

export type EnvironmentBranchScope = {
  id?: number;
  repositoryId?: number;
  defaultBranch?: string;
  selectedBranches?: string[];
  branches?: Array<{ name?: string; branchName?: string; defaultBranch?: boolean; selected?: boolean }>;
};

const selectedBranchNamesForScope = (scope?: EnvironmentBranchScope | null) => {
  const explicit = scope?.selectedBranches?.map(normalize).filter(Boolean) || [];
  if (explicit.length > 0) return new Set(explicit);

  const branchSelections = (scope?.branches || [])
    .filter((branch) => branch.selected || branch.defaultBranch)
    .map((branch) => normalize(branch.name || branch.branchName))
    .filter(Boolean);
  if (branchSelections.length > 0) return new Set(branchSelections);

  const defaultBranch = normalize(scope?.defaultBranch);
  return defaultBranch ? new Set([defaultBranch]) : null;
};

export const filterEnvironmentsForBranchScope = <T extends EnvironmentResponse>(
  environments: T[],
  scope?: EnvironmentBranchScope | null,
) => {
  const repositoryId = scope?.repositoryId ?? scope?.id;
  const selectedBranches = selectedBranchNamesForScope(scope);

  return environments.filter((environment) => {
    if (repositoryId && environment.repositoryId && environment.repositoryId !== repositoryId) {
      return false;
    }

    if (!selectedBranches || selectedBranches.size === 0) {
      return true;
    }

    const labels = [environment.branchName, environment.name].map(normalize).filter(Boolean);
    return labels.some((label) => selectedBranches.has(label));
  });
};
