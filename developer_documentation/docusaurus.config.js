// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {themes} = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'OpenCDP SDKs',
  tagline: 'Client libraries for Codematic Customer Data Platform',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.opencdp.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/',

  // GitHub pages deployment config (if needed)
  organizationName: 'codematic',
  projectName: 'cdp-node',

  onBrokenLinks: 'warn',
  
  markdown: {
    mermaid: false,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/', // Make docs the home page
        },
        blog: false, // Disable blog
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  themes: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      ({
        hashed: true,
        language: ["en"],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: '/',
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'OpenCDP SDKs',
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Overview',
          },
          {
            type: 'doc',
            docId: 'node/intro',
            position: 'left',
            label: 'Node.js',
          },
          {
            type: 'doc',
            docId: 'flutter/intro',
            position: 'left',
            label: 'Flutter',
          },
          {
            href: 'https://www.npmjs.com/package/@codematic.io/cdp-node',
            label: 'npm',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'SDKs',
            items: [
              {
                label: 'Node.js SDK',
                to: '/node/intro',
              },
              {
                label: 'Flutter SDK',
                to: '/flutter/intro',
              },
            ],
          },
          {
            title: 'Node.js Resources',
            items: [
              {
                label: 'Getting Started',
                to: '/node/getting-started/installation',
              },
              {
                label: 'API Reference',
                to: '/node/api/client',
              },
              {
                label: 'npm Package',
                href: 'https://www.npmjs.com/package/@codematic.io/cdp-node',
              },
            ],
          },
          {
            title: 'Flutter Resources',
            items: [
              {
                label: 'Getting Started',
                to: '/flutter/getting-started/installation',
              },
              {
                label: 'API Reference',
                to: '/flutter/api/methods',
              },
              {
                label: 'pub.dev Package',
                href: 'https://pub.dev/packages/open_cdp_flutter_sdk',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Changelog',
                to: '/changelog',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Codematic.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['bash', 'json', 'dart', 'yaml', 'swift', 'ruby'],
      },
    }),
};

module.exports = config;

