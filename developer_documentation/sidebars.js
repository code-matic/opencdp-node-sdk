/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'Node.js SDK',
      collapsed: false,
      items: [
        {
          type: 'doc',
          id: 'node/intro',
          label: 'Introduction',
        },
        {
          type: 'category',
          label: 'Getting Started',
          items: [
            'node/getting-started/installation',
            'node/getting-started/quick-start',
            'node/getting-started/configuration',
          ],
        },
        {
          type: 'category',
          label: 'API Reference',
          items: [
            'node/api/client',
            'node/api/identify',
            'node/api/track',
            'node/api/send-email',
            'node/api/send-push',
            'node/api/send-sms',
            'node/api/register-device',
            'node/api/types',
          ],
        },
        {
          type: 'category',
          label: 'Guides',
          items: [
            'node/guides/dual-write',
            'node/guides/error-handling',
            'node/guides/best-practices',
            'node/guides/testing',
          ],
        },
        {
          type: 'category',
          label: 'Examples',
          items: [
            'node/examples/basic-usage',
            'node/examples/email-templates',
            'node/examples/push-notifications',
            'node/examples/sms-notifications',
            'node/examples/bulk-operations',
          ],
        },
        {
          type: 'doc',
          id: 'node/troubleshooting',
          label: 'Troubleshooting',
        },
        {
          type: 'doc',
          id: 'node/changelog',
          label: 'Changelog',
        },
      ],
    },
    {
      type: 'category',
      label: 'Flutter SDK',
      collapsed: true,
      items: [
        {
          type: 'doc',
          id: 'flutter/intro',
          label: 'Introduction',
        },
        {
          type: 'category',
          label: 'Getting Started',
          items: [
            'flutter/getting-started/installation',
            'flutter/getting-started/quick-start',
            'flutter/getting-started/configuration',
          ],
        },
        {
          type: 'category',
          label: 'Features',
          items: [
            'flutter/features/screen-tracking',
            'flutter/features/push-notifications',
          ],
        },
        {
          type: 'category',
          label: 'API Reference',
          items: [
            'flutter/api/methods',
          ],
        },
        {
          type: 'doc',
          id: 'flutter/changelog',
          label: 'Changelog',
        },
      ],
    },
    {
      type: 'doc',
      id: 'changelog',
      label: 'All Changelogs',
    },
  ],
};

module.exports = sidebars;

