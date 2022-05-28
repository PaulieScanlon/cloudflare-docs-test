import React from 'react';
import { Link, graphql } from 'gatsby';

const Page = ({
  data,
  data: {
    cloudflare: { html }
  }
}) => {
  return (
    <div>
      <Link to="/">Back</Link>
      <div dangerouslySetInnerHTML={{ __html: html }} />;
    </div>
  );
};

export const query = graphql`
  query ($id: String) {
    cloudflare(id: { eq: $id }) {
      name
      html
    }
  }
`;

export default Page;
