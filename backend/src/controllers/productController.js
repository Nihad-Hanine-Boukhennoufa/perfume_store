import Product from '../models/Product.js';

// Get all products
export const getProducts = async (req , res) => {
    try{
        const products = await Product.find();
        res.status(200).json(products);
    }catch(error){
        res.status(404).json({ message: error.message });
    }
}
 // GET product by ID
 export const getProduct = async (req , res ) => {
    try {
        const product = await Product.findById(req.params.id);
        if(!product) return res.status(404).json({ message: "Product not found" });
        res.status(200).json(product);
    }catch (error) {
        res.status(404).json({ message: error.message });
    }
 }

 // Create a new product
 export const createProduct =async (req , res) => {
    
    try {
        const newProduct = new Product({
  ...req.body,
  image: req.file ? req.file.filename : ""
});

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    }catch (error) {
        res.status(409).json({ message: error.message });
    }
};

// Update a product
export const updateProduct = async (req , res) => {
    try {
        const updatedData = {
      ...req.body
    };

    // If a new image file is uploaded, update the image field
    if (req.file) {
      updatedData.image = req.file.filename;
    }
        const updateProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }); // The { new: true } option returns the updated document instead of the original.
        if(!updateProduct) return res.status(404).json({ message: "Product not found" });
        res.status(200).json(updateProduct);
    }catch (error) {
        res.status(409).json({ message: error.message });
    }
}

// Delete a product
export const deleteProduct = async (req , res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if(!deletedProduct) return res.status(404).json({ message: "Product not found" });
        res.status(200).json({ message: "Product deleted successfully" });
    }catch (error) {
        res.status(409).json({ message: error.message });
    }
}

