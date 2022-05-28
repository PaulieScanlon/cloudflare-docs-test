const { graphql } = require('@octokit/graphql');
const remark = require('remark');
const remarkParse = require('remark-parse');
const remarkRehype = require('remark-rehype');
const rehypeSlug = require('rehype-slug');
const rehypeStringify = require('rehype-stringify');
const matter = require('gray-matter');

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${process.env.OCTOKIT_PERSONAL_ACCESS_TOKEN}`
  }
});

const convertToHTML = async (markdown) => {
  const grayMatter = matter(markdown);
  const response = await remark()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(grayMatter.content);

  return String(response);
};

const transformFrontmatter = (markdown) => {
  const grayMatter = matter(markdown);
  return grayMatter.data;
};

exports.sourceNodes = async ({ actions: { createNode }, createContentDigest }) => {
  const {
    repository: {
      folder: { entries }
    }
  } = await graphqlWithAuth(`
        query {
            repository(owner: "cloudflare", name: "cloudflare-docs") {
              folder: object(expression: "production:content/pages") {
                ... on Tree {
                  entries {
                    name
                    extension
                    oid
                    object {
                      ... on Blob {
                        text
                      }
                      ... on Tree {
                        entries {
                          name
                          extension
                          oid
                          object {
                            ... on Blob {
                              text
                            }
                            ... on Tree {
                              entries {
                                name
                                extension
                                oid
                                object {
                                  ... on Blob {
                                    text
                                  }
                                  ... on Tree {
                                    entries {
                                      name
                                      extension
                                      oid
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
    `);

  const createMarkdownNode = async (object, name, oid) => {
    const { text } = object;
    createNode({
      id: oid,
      name: name,
      frontmatter: await transformFrontmatter(text || '---\ntitle: null\n---'),
      html: await convertToHTML(text || '\nnull\n'),
      internal: {
        type: 'cloudflare',
        contentDigest: createContentDigest(object)
      }
    });
  };

  entries.forEach((item) => {
    const { object, name, extension, oid } = item;
    if (object && Array.isArray(object.entries)) {
      object.entries.forEach((item) => {
        const { object, name, extension, oid } = item;
        if (extension === '.md') {
          createMarkdownNode(object, name, oid);
        }
        if (item && Array.isArray(item.object.entries)) {
          const markdown = item.object.entries.filter((item) => item.extension === '.md')[0];

          if (markdown) {
            createMarkdownNode(object, markdown.name, markdown.oid);
          }
        }
      });
    } else if (extension === '.md') {
      createMarkdownNode(object, name, oid);
    }
  });
};
