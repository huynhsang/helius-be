/** Represents a persisted resource entity. */
export interface Resource {
  /** Unique identifier (UUID). */
  id: string
  /** Display name of the resource. */
  name: string
  /** Optional description of the resource. */
  description: string
  /** ISO-8601 timestamp of creation. */
  createdAt: string
  /** ISO-8601 timestamp of last update. */
  updatedAt: string
}

/** Input data required to create a new resource. */
export interface CreateResourceInput {
  /** Display name of the resource. */
  name: string
  /** Optional description of the resource. */
  description?: string
}

/** Input data for partially updating an existing resource. */
export interface UpdateResourceInput {
  /** New name for the resource. */
  name?: string
  /** New description for the resource. */
  description?: string
}

/** Filter criteria for listing resources. */
export interface ResourceFilter {
  /** Case-insensitive partial match on name. */
  name?: string
}
