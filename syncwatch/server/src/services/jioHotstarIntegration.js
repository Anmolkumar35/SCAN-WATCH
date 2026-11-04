class JioHotstarIntegrationService {
  constructor() {
    this.catalog = [
      {
        id: 'jh_001',
        title: 'Special OPS',
        officialDeepLink: 'https://www.hotstar.com/in/shows/special-ops/1260022894',
        testTrailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      },
      {
        id: 'jh_002',
        title: 'Aarya',
        officialDeepLink: 'https://www.hotstar.com/in/shows/aarya/1260028094',
        testTrailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
      }
    ];
  }
  getCuratedCatalog() { return this.catalog; }
  getContentById(contentId) { return this.catalog.find(c => c.id === contentId) || null; }
}
module.exports = new JioHotstarIntegrationService();
