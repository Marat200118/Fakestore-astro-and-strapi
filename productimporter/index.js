import url from "url";
import path from "path";

console.log("Here we go!");

const SERVER_URL = "http://localhost:1337";

const init = async () => {
  const products = await getProducts();
  const categories = getUniqueCategories(products);
  const strapiCategories = await insertCategories(categories);
  insertProducts(products, strapiCategories);
};

const getBlobForProduct = (product) =>
  fetch(product.image).then((r) => r.blob());

const getUniqueCategories = (products) => [
  ...new Set(products.map((p) => p.category)),
];

const insertCategories = (categories) =>
  Promise.all(
    categories.map((category) =>
      fetch(`${SERVER_URL}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            name: category,
          },
        }),
      }).then((r) => r.json())
    )
  );

const insertProducts = (products, strapiCategories) => {
  products.forEach(async (product) => {
    const { title, price, description, category, rating } = product;

    const formData = new FormData();
    const blob = await getBlobForProduct(product);
    const filename = path.basename(url.parse(product.image).pathname);
    formData.append("files.image", blob, filename);

    const data = {
      title,
      price,
      description,
      rating: rating.rate,
      category: strapiCategories.find(
        (c) => c.data.attributes.name === category
      ).data.id,
    };

    formData.append("data", JSON.stringify(data));

    await fetch(`${SERVER_URL}/api/products`, {
      method: "POST",
      body: formData,
    }).then((r) => r.json());

    console.log(`Product ${title} inserted`);
  });
};

const getProducts = () =>
  fetch("https://fakestoreapi.com/products").then((r) => r.json());

init();
