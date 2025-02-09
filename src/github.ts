import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'

// Inspired by https://github.com/mathieudutour/github-tag-action
// Refs:
// - https://octokit.github.io/rest.js/v19
// - https://docs.github.com/ja/rest/repos/repos?apiVersion=2022-11-28

type Tag = {
  name: string
  commit: {
    sha: string
    url: string
  }
  zipball_url: string
  tarball_url: string
  node_id: string
}

type Release = {
  url: string
}

let octokitSingleton: ReturnType<typeof getOctokit>

function getOctokitSingleton(): ReturnType<typeof getOctokit> {
  if (octokitSingleton) {
    return octokitSingleton
  }
  const githubToken = core.getInput('github_token')
  octokitSingleton = getOctokit(githubToken)
  return octokitSingleton
}

export async function listTags(
  fetchedTags: Tag[] = [],
  page = 1
): Promise<Tag[]> {
  const octokit = getOctokitSingleton()

  const tags = await octokit.rest.repos.listTags({
    ...context.repo,
    per_page: 100,
    page
  })

  if (tags.data.length < 100) {
    return [...fetchedTags, ...tags.data]
  }

  return listTags([...fetchedTags, ...tags.data], page + 1)
}

export async function createRelease(tagName: string): Promise<Release> {
  const octokit = getOctokitSingleton()
  return octokit.rest.repos.createRelease({
    tag_name: tagName,
    target_commitish: context.sha,
    ...context.repo
  })
}
