import React from 'react';
import { Link, graphql } from 'gatsby';

const ComponentName = ({
  data: {
    allCloudflare: { nodes }
  }
}) => {
  return (
    <main>
      <ul>
        {nodes.map((node, index) => {
          const { gatsbyPath, name } = node;
          return (
            <li key={index}>
              <Link to={gatsbyPath}>{name}</Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
};

export const query = graphql`
  {
    allCloudflare {
      nodes {
        gatsbyPath(filePath: "/{cloudflare.name}")
        name
      }
    }
  }
`;

export default ComponentName;
