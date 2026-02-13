import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Boxes, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  product_code: string;
  product_name: string | null;
  ativo: boolean;
  created_at: string;
}

interface Kit {
  id: string;
  sku_code: string;
  sku_name: string | null;
  kit_quantity: number;
  created_at: string;
}

interface ProductForm {
  product_code: string;
  product_name: string;
  ativo: boolean;
}

interface KitForm {
  sku_code: string;
  sku_name: string;
  kit_quantity: number;
}

export const StockProductsManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(false);

  // Product dialog state
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>({ product_code: "", product_name: "", ativo: true });

  // Kit dialog state
  const [isKitDialogOpen, setIsKitDialogOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [kitForm, setKitForm] = useState<KitForm>({ sku_code: "", sku_name: "", kit_quantity: 1 });

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("stock_product_whitelist").select("*").order("product_code");
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  const fetchKits = async () => {
    setLoading(true);
    const { data } = await supabase.from("stock_kit_config").select("*").order("sku_code");
    setKits((data as Kit[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    fetchKits();
  }, []);

  // === PRODUCT HANDLERS ===
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProductForm({ product_code: "", product_name: "", ativo: true });
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({ product_code: product.product_code, product_name: product.product_name || "", ativo: product.ativo });
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.product_code.trim()) {
      toast.error("Código do produto é obrigatório");
      return;
    }

    if (editingProduct) {
      const { error } = await supabase
        .from("stock_product_whitelist")
        .update({
          product_code: productForm.product_code.trim(),
          product_name: productForm.product_name.trim() || null,
          ativo: productForm.ativo,
        })
        .eq("id", editingProduct.id);

      if (error) {
        toast.error("Erro ao atualizar: " + error.message);
      } else {
        toast.success("Produto atualizado!");
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from("stock_product_whitelist").insert({
        product_code: productForm.product_code.trim(),
        product_name: productForm.product_name.trim() || null,
        ativo: productForm.ativo,
      });

      if (error) {
        toast.error("Erro ao criar: " + error.message);
      } else {
        toast.success("Produto adicionado!");
        fetchProducts();
      }
    }
    setIsProductDialogOpen(false);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (confirm("Tem certeza que deseja deletar este produto?")) {
      const { error } = await supabase.from("stock_product_whitelist").delete().eq("id", product.id);
      if (error) {
        toast.error("Erro ao deletar: " + error.message);
      } else {
        toast.success("Produto deletado!");
        fetchProducts();
      }
    }
  };

  const handleToggleProductActive = async (product: Product) => {
    const { error } = await supabase
      .from("stock_product_whitelist")
      .update({ ativo: !product.ativo })
      .eq("id", product.id);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success(product.ativo ? "Produto desativado!" : "Produto ativado!");
      fetchProducts();
    }
  };

  // === KIT HANDLERS ===
  const handleOpenNewKit = () => {
    setEditingKit(null);
    setKitForm({ sku_code: "", sku_name: "", kit_quantity: 1 });
    setIsKitDialogOpen(true);
  };

  const handleEditKit = (kit: Kit) => {
    setEditingKit(kit);
    setKitForm({ sku_code: kit.sku_code, sku_name: kit.sku_name || "", kit_quantity: kit.kit_quantity });
    setIsKitDialogOpen(true);
  };

  const handleSaveKit = async () => {
    if (!kitForm.sku_code.trim()) {
      toast.error("Código do SKU é obrigatório");
      return;
    }

    if (kitForm.kit_quantity <= 0) {
      toast.error("Quantidade do kit deve ser maior que zero");
      return;
    }

    if (editingKit) {
      const { error } = await supabase
        .from("stock_kit_config")
        .update({
          sku_code: kitForm.sku_code.trim(),
          sku_name: kitForm.sku_name.trim() || null,
          kit_quantity: kitForm.kit_quantity,
        })
        .eq("id", editingKit.id);

      if (error) {
        toast.error("Erro ao atualizar: " + error.message);
      } else {
        toast.success("Kit atualizado!");
        fetchKits();
      }
    } else {
      const { error } = await supabase.from("stock_kit_config").insert({
        sku_code: kitForm.sku_code.trim(),
        sku_name: kitForm.sku_name.trim() || null,
        kit_quantity: kitForm.kit_quantity,
      });

      if (error) {
        toast.error("Erro ao criar: " + error.message);
      } else {
        toast.success("Kit adicionado!");
        fetchKits();
      }
    }
    setIsKitDialogOpen(false);
  };

  const handleDeleteKit = async (kit: Kit) => {
    if (confirm("Tem certeza que deseja deletar este kit?")) {
      const { error } = await supabase.from("stock_kit_config").delete().eq("id", kit.id);
      if (error) {
        toast.error("Erro ao deletar: " + error.message);
      } else {
        toast.success("Kit deletado!");
        fetchKits();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="whitelist" className="space-y-4">
      <TabsList className="bg-dashboard-dark border-dashboard-border">
        <TabsTrigger value="whitelist" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Whitelist de Produtos
        </TabsTrigger>
        <TabsTrigger value="kits" className="flex items-center gap-2">
          <Boxes className="h-4 w-4" />
          Configuração de Kits
        </TabsTrigger>
      </TabsList>

      {/* === PRODUCTS TAB === */}
      <TabsContent value="whitelist">
        <Card className="bg-dashboard-card border-dashboard-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-foreground">Whitelist de Produtos</CardTitle>
              <CardDescription className="text-muted-foreground">
                Controle quais produtos aparecem no Estoque
              </CardDescription>
            </div>
            <Button size="sm" className="bg-dashboard-accent text-dashboard-dark" onClick={handleOpenNewProduct}>
              <Plus className="h-4 w-4 mr-1" /> Novo Produto
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-dashboard-border">
                  <TableHead className="text-muted-foreground">Código</TableHead>
                  <TableHead className="text-muted-foreground">Nome</TableHead>
                  <TableHead className="text-muted-foreground text-center">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="border-dashboard-border">
                    <TableCell className="text-foreground font-mono text-sm">{product.product_code}</TableCell>
                    <TableCell className="text-foreground">{product.product_name || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.ativo ? "default" : "secondary"} className={product.ativo ? "bg-green-500/20 text-green-400" : ""}>
                        {product.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleProductActive(product)}
                        title={product.ativo ? "Desativar" : "Ativar"}
                      >
                        <Checkbox checked={product.ativo} className="cursor-pointer" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteProduct(product)} title="Deletar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum produto na whitelist
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent className="bg-dashboard-card border-dashboard-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingProduct ? "Editar" : "Novo"} Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-foreground text-sm">Código do Produto</Label>
                <Input
                  value={productForm.product_code}
                  onChange={(e) => setProductForm({ ...productForm, product_code: e.target.value })}
                  className="bg-dashboard-dark border-dashboard-border text-foreground text-sm mt-1"
                  placeholder="Ex: SKU001"
                />
              </div>
              <div>
                <Label className="text-foreground text-sm">Nome do Produto</Label>
                <Input
                  value={productForm.product_name}
                  onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                  className="bg-dashboard-dark border-dashboard-border text-foreground text-sm mt-1"
                  placeholder="Ex: Produto Premium"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="product-ativo"
                  checked={productForm.ativo}
                  onCheckedChange={(checked) => setProductForm({ ...productForm, ativo: checked as boolean })}
                />
                <label htmlFor="product-ativo" className="text-sm text-foreground cursor-pointer">
                  Ativo
                </label>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsProductDialogOpen(false)} className="border-dashboard-border">
                Cancelar
              </Button>
              <Button onClick={handleSaveProduct} className="bg-dashboard-accent text-dashboard-dark">
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>

      {/* === KITS TAB === */}
      <TabsContent value="kits">
        <Card className="bg-dashboard-card border-dashboard-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-foreground">Configuração de Kits</CardTitle>
              <CardDescription className="text-muted-foreground">
                Defina quantos itens compõem cada kit
              </CardDescription>
            </div>
            <Button size="sm" className="bg-dashboard-accent text-dashboard-dark" onClick={handleOpenNewKit}>
              <Plus className="h-4 w-4 mr-1" /> Novo Kit
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-dashboard-border">
                  <TableHead className="text-muted-foreground">Código SKU</TableHead>
                  <TableHead className="text-muted-foreground">Nome SKU</TableHead>
                  <TableHead className="text-muted-foreground text-center">Qtd. por Kit</TableHead>
                  <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kits.map((kit) => (
                  <TableRow key={kit.id} className="border-dashboard-border">
                    <TableCell className="text-foreground font-mono text-sm">{kit.sku_code}</TableCell>
                    <TableCell className="text-foreground">{kit.sku_name || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-dashboard-accent border-dashboard-accent/50">
                        {kit.kit_quantity} un.
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditKit(kit)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteKit(kit)} title="Deletar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {kits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum kit configurado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isKitDialogOpen} onOpenChange={setIsKitDialogOpen}>
          <DialogContent className="bg-dashboard-card border-dashboard-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingKit ? "Editar" : "Novo"} Kit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-foreground text-sm">Código do SKU</Label>
                <Input
                  value={kitForm.sku_code}
                  onChange={(e) => setKitForm({ ...kitForm, sku_code: e.target.value })}
                  className="bg-dashboard-dark border-dashboard-border text-foreground text-sm mt-1"
                  placeholder="Ex: KIT001"
                />
              </div>
              <div>
                <Label className="text-foreground text-sm">Nome do SKU</Label>
                <Input
                  value={kitForm.sku_name}
                  onChange={(e) => setKitForm({ ...kitForm, sku_name: e.target.value })}
                  className="bg-dashboard-dark border-dashboard-border text-foreground text-sm mt-1"
                  placeholder="Ex: Kit Restaurante"
                />
              </div>
              <div>
                <Label className="text-foreground text-sm">Quantidade de itens por kit</Label>
                <Input
                  type="number"
                  min={1}
                  value={kitForm.kit_quantity}
                  onChange={(e) => setKitForm({ ...kitForm, kit_quantity: parseInt(e.target.value) || 1 })}
                  className="bg-dashboard-dark border-dashboard-border text-foreground text-sm mt-1"
                  placeholder="Ex: 10"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsKitDialogOpen(false)} className="border-dashboard-border">
                Cancelar
              </Button>
              <Button onClick={handleSaveKit} className="bg-dashboard-accent text-dashboard-dark">
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>
    </Tabs>
  );
};

export default StockProductsManager;
