const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("@elastic/elasticsearch");

const app = express();
const port = 3244;

app.use(bodyParser.json());

const esClient = new Client({
  node: "http://localhost:9200",
  auth: {
    username: "ashish.arora",
    password: "ashish.arora",
  },
});

async function initializeIndex() {
  try {
    const exists = await esClient.indices.exists({ index: "products" });
    if (!exists.body) {
      await createIndex();
    } else {
      console.log("Index already exists.");
      // Handle the case when the index already exists, if needed
    }
  } catch (error) {
    console.error("Error initializing index:", error);
  }
}

// Create index and populate it with sample data
async function createIndex() {
  try {
    const exists = await esClient.indices.exists({ index: "products" });
    if (!exists.body) {
      await esClient.indices.create({ index: "products" });
      // Add logic to populate the index with sample data if needed
      console.log("Index created successfully.");
    } else {
      console.log("Index already exists.");
      // Handle the case when the index already exists, if needed
      // For example, update index settings or mappings
    }
  } catch (error) {
    console.error("Error creating index:", error);
  }
}

// initializeIndex();

// Create a new product
app.post("/products", async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    const response = await esClient.index({
      index: "products",
      body: { name, price, description, category },
    });
    res.json(response.body);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).send("Error creating product");
  }
});

// Get all products
app.get("/products", async (req, res) => {
  try {
    const body = await esClient.search({
      index: "products",
      body: { query: { match_all: {} } },
    });
    if (body && body.hits && body.hits.hits) {
      const products = body.hits.hits.map((hit) => {
        return { ...hit._source, id: hit._id };
      });
      res.json(products);
    } else {
      console.error("Empty response from Elasticsearch");
      res.status(404).send("No products found");
    }
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).send("Error getting products");
  }
});

// Get a single product by ID
// Get a single product by ID
app.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = await esClient.get({
      index: "products",
      id,
    });
    res.json(body._source);
  } catch (error) {
    console.error("Error getting product by ID:", error);
    res.status(500).send("Error getting product by ID");
  }
});

// Update a product by ID
app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, category } = req.body;
    const response = await esClient.update({
      index: "products",
      id,
      body: { doc: { name, price, description, category } },
    });
    res.json(response.body);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Error updating product");
  }
});

// Delete a product by ID
app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await esClient.delete({
      index: "products",
      id,
    });
    res.json(response.body);
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send("Error deleting product");
  }
});

// Search products
app.post("/products/search", async (req, res) => {
  try {
    const { query } = req.body;
    console.log(query);
    const body = await esClient.search({
      index: "products",
      body: {
        query: {
          multi_match: { query, fields: ["name", "description", "category"] },
        },
      },
    });
    res.json(body.hits.hits.map((hit) => hit._source));
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).send("Error searching products");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
