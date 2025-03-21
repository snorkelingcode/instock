
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define Product interface
interface Product {
  id: number;
  product_line: string;
  product: string;
  source: string;
  price: number;
  listing_link: string;
  image_link?: string;
  in_stock?: boolean;
}

const ManageProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Initialize form for adding/editing products
  const form = useForm<Omit<Product, 'id'>>({
    defaultValues: {
      product_line: "",
      product: "",
      source: "",
      price: 0,
      listing_link: "",
      image_link: "",
      in_stock: true
    }
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // If selectedProduct changes, update form values
  useEffect(() => {
    if (selectedProduct && isEditDialogOpen) {
      form.reset({
        product_line: selectedProduct.product_line,
        product: selectedProduct.product,
        source: selectedProduct.source,
        price: selectedProduct.price,
        listing_link: selectedProduct.listing_link,
        image_link: selectedProduct.image_link || "",
        in_stock: selectedProduct.in_stock !== undefined ? selectedProduct.in_stock : true
      });
    }
  }, [selectedProduct, isEditDialogOpen, form]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: `Failed to load products: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    form.reset({
      product_line: "",
      product: "",
      source: "",
      price: 0,
      listing_link: "",
      image_link: "",
      in_stock: true
    });
    setIsAddDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);
      
      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (formData: Omit<Product, 'id'>) => {
    try {
      if (selectedProduct && isEditDialogOpen) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', selectedProduct.id);
        
        if (error) throw error;
        
        setProducts(products.map(p => p.id === selectedProduct.id ? { ...formData, id: selectedProduct.id } : p));
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
        setIsEditDialogOpen(false);
      } else {
        // Add new product
        const { data, error } = await supabase
          .from('products')
          .insert(formData)
          .select();
        
        if (error) throw error;
        
        setProducts([...products, data[0]]);
        toast({
          title: "Success",
          description: "Product added successfully",
        });
        setIsAddDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save product: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <RequireAdmin>
      <Layout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold">Manage Products</CardTitle>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading products...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Product Line</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center h-24">
                            No products found
                          </TableCell>
                        </TableRow>
                      ) : (
                        products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>{product.id}</TableCell>
                            <TableCell>{product.product_line}</TableCell>
                            <TableCell>{product.product}</TableCell>
                            <TableCell>{product.source}</TableCell>
                            <TableCell>${product.price.toFixed(2)}</TableCell>
                            <TableCell>
                              {product.in_stock === true ? "In Stock" : 
                               product.in_stock === false ? "Out of Stock" : "Unknown"}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(product)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(product)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this product? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Product Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update the product details below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="product_line" className="text-right">
                      Product Line
                    </Label>
                    <Input
                      id="product_line"
                      {...form.register('product_line')}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="product" className="text-right">
                      Product
                    </Label>
                    <Input
                      id="product"
                      {...form.register('product')}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="source" className="text-right">
                      Source
                    </Label>
                    <Input
                      id="source"
                      {...form.register('source')}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Price
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      {...form.register('price', { valueAsNumber: true })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="listing_link" className="text-right">
                      Listing Link
                    </Label>
                    <Input
                      id="listing_link"
                      {...form.register('listing_link')}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="image_link" className="text-right">
                      Image Link
                    </Label>
                    <Input
                      id="image_link"
                      {...form.register('image_link')}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="in_stock" className="text-right">
                      In Stock
                    </Label>
                    <div className="col-span-3">
                      <select 
                        id="in_stock"
                        {...form.register('in_stock', {
                          setValueAs: (value) => {
                            if (value === "true") return true;
                            if (value === "false") return false;
                            return undefined;
                          }
                        })}
                        className="w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="true">In Stock</option>
                        <option value="false">Out of Stock</option>
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Product Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Enter the details for the new product.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="product_line" className="text-right">
                      Product Line
                    </Label>
                    <Input
                      id="product_line"
                      {...form.register('product_line')}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="product" className="text-right">
                      Product
                    </Label>
                    <Input
                      id="product"
                      {...form.register('product')}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="source" className="text-right">
                      Source
                    </Label>
                    <Input
                      id="source"
                      {...form.register('source')}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Price
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      {...form.register('price', { valueAsNumber: true })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="listing_link" className="text-right">
                      Listing Link
                    </Label>
                    <Input
                      id="listing_link"
                      {...form.register('listing_link')}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="image_link" className="text-right">
                      Image Link
                    </Label>
                    <Input
                      id="image_link"
                      {...form.register('image_link')}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="in_stock" className="text-right">
                      In Stock
                    </Label>
                    <div className="col-span-3">
                      <select 
                        id="in_stock"
                        {...form.register('in_stock', {
                          setValueAs: (value) => {
                            if (value === "true") return true;
                            if (value === "false") return false;
                            return undefined;
                          }
                        })}
                        className="w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="true">In Stock</option>
                        <option value="false">Out of Stock</option>
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Add Product</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </RequireAdmin>
  );
};

export default ManageProducts;
