#!/usr/bin/env node
/**
 * Publisher
 * - Updates data/posts.json with generator output.
 * - Writes automation/output/pipeline-status.json for UI consumption.
 */

const path = require('path');
const { readJson, writeJson, ensureDir } = require('../lib/io');

const root = path.resolve(__dirname, '..', '..');
const postsJsonPath = path.join(root, 'data', 'posts.json');
const statusPath = path.join(root, 'automation', 'output', 'pipeline-status.json');

const updatePosts = (posts, newEntry) => {
  const list = Array.isArray(posts) ? [...posts] : [];
  if (!newEntry) return list;
  const filtered = list.filter((post) => post.url !== newEntry.url);
  filtered.push(newEntry);
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  return filtered;
};

const runPublisher = async ({ collectorResult, generatorResult }) => {
  const posts = readJson(postsJsonPath, []);
  let updatedPosts = posts;
  let addedPost = false;

  if (generatorResult?.generated && generatorResult.postEntry) {
    updatedPosts = updatePosts(posts, generatorResult.postEntry);
    writeJson(postsJsonPath, updatedPosts);
    addedPost = true;
  }

  ensureDir(path.dirname(statusPath));
  const status = {
    lastRun: new Date().toISOString(),
    scheduleJST: ['09:00', '21:00'],
    collector: collectorResult ?? null,
    generator: generatorResult ?? null,
    publisher: {
      addedPost,
      totalPosts: updatedPosts.length,
    },
  };
  writeJson(statusPath, status);
  return status;
};

if (require.main === module) {
  runPublisher({})
    .then((status) => {
      console.log('Publisher finished:', status);
    })
    .catch((error) => {
      console.error('Publisher failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runPublisher,
};
