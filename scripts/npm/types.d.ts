export interface PluginConfig {
  /**
   * Define if the package should be published on npm repository.
   */
  npmPublish?: boolean;
}

export interface ReleaseInfo {
  /**
   * The release distTag name.
   */
  name: string;
  /**
   * NPM distag URL.
   */
  url: string;
  /**
   * Channel name.
   */
  channel: string;
}
