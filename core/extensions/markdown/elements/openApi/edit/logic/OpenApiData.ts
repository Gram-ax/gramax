const OpenApiData = `openapi: "3.0.0"
info:
  title: JSONPlaceholder API
  version: 1.0.0
  description: |
    This is the exact starter specification inserted when a new OpenAPI block is created in Gramax.

    1. \`GET /posts\` returns a public list of example posts and accepts an optional \`userId\` filter.
    2. \`GET /posts/{id}\` returns one post and requires the post identifier in the path.
    3. Both operations reuse the \`Post\` schema through internal \`$ref\` links.

    Switch an operation to \`Try it\` to send a read-only GET request directly to the public JSONPlaceholder API. No local mock is involved and the example does not modify remote data.
servers:
  - url: https://jsonplaceholder.typicode.com
    description: JSONPlaceholder public API
tags:
  - name: Posts
    description: Read the public collection of example posts.
paths:
  /posts:
    get:
      tags:
        - Posts
      operationId: listPosts
      summary: List posts
      parameters:
        - name: userId
          in: query
          description: Filter posts by author.
          schema:
            type: integer
            default: 1
      responses:
        "200":
          description: Posts returned successfully.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Post"
              example:
                - userId: 1
                  id: 1
                  title: Example post
                  body: Example post body
  /posts/{id}:
    get:
      tags:
        - Posts
      operationId: getPost
      summary: Get a post
      parameters:
        - name: id
          in: path
          required: true
          description: Post identifier.
          schema:
            type: integer
            default: 1
      responses:
        "200":
          description: Post returned successfully.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Post"
              example:
                userId: 1
                id: 1
                title: Example post
                body: Example post body
        "404":
          description: Post not found.
components:
  schemas:
    Post:
      type: object
      required:
        - userId
        - id
        - title
        - body
      properties:
        userId:
          type: integer
          example: 1
        id:
          type: integer
          example: 1
        title:
          type: string
          example: Example post
        body:
          type: string
          example: Example post body
`;

export default OpenApiData;
