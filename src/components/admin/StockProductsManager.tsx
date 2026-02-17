import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

interface CombinedProduct {
  product: Product;
  kit: Kit | null;
}

interface ProductForm {
  product_code: string;
  product_name: string;
  ativo: boolean;
  kit_quantity: number;
}

export const StockProductsManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CombinedProduct | null>(null);
  const [form, setForm] = useState<ProductForm>({ product_code: "", product_name: "", ativo: true, kit_quantity: 1 });

  const fetchData = async () => {
    setLoading(true);
    const [prodRes, kitRes] = await Promise.all([
      supabase.from("stock_product_whitelist").select("*").order("product_code"),
      supabase.from("stock_kit_config").select("*").order("sku_code"),
    ]);
    setProducts((prodRes.data as Product[]) || []);
    setKits((kitRes.data as Kit[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const combinedList = useMemo((): CombinedProduct[] => {
    const kitMap = new Map(kits.map(k => [k.sku_code, k]));
    return products.map(p => ({
      product: p,
      kit: kitMap.get(p.product_code) || null,
    }));
  }, [products, kits]);

  const handleOpenNew = () => {
    setEditingProduct(null);
    setForm({ product_code: "", product_name: "", ativo: true, kit_quantity: 1 });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: CombinedProduct) => {
    setEditingProduct(item);
    setForm({
      product_code: item.product.product_code,
      product_name: item.product.product_name || "",
      ativo: item.product.ativo,
      kit_quantity: item.kit?.kit_quantity || 1,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.product_code.trim()) {
      toast.error("Código do produto é obrigatório");
      return;
    }

    const code = form.product_code.trim();
    const name = form.product_name.trim() || null;

    if (editingProduct) {
      // Update product
      const { error: prodErr } = await supabase
        .from("stock_product_whitelist")
        .update({ product_code: code, product_name: name, ativo: form.ativo })
        .eq("id", editingProduct.product.id);
      if (prodErr) { toast.error("Erro: " + prodErr.message); return; }

      // Update or create kit
      if (editingProduct.kit) {
        await supabase.from("stock_kit_config")
          .update({ sku_code: code, sku_name: name, kit_quantity: form.kit_quantity })
          .eq("id", editingProduct.kit.id);
      } else if (form.kit_quantity > 1) {
        await supabase.from("stock_kit_config")
          .insert({ sku_code: code, sku_name: name, kit_quantity: form.kit_quantity });
      }

      toast.success("Produto atualizado!");
    } else {
      // Create product
      const { error: prodErr } = await supabase.from("stock_product_whitelist")
        .insert({ product_code: code, product_name: name, ativo: form.ativo });
      if (prodErr) { toast.error("Erro: " + prodErr.message); return; }

      // Create kit config if quantity > 1
      if (form.kit_quantity > 1) {
        await supabase.from("stock_kit_config")
          .insert({ sku_code: code, sku_name: name, kit_quantity: form.kit_quantity });
      }

      toast.success("Produto adicionado!");
    }

    setIsDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (item: CombinedProduct) => {
    if (!confirm("Tem certeza que deseja deletar este produto?")) return;
    await supabase.from("stock_product_whitelist").delete().eq("id", item.product.id);
    if (item.kit) {
      await supabase.from("stock_kit_config").delete().eq("id", item.kit.id);
    }
    toast.success("Produto deletado!");
    fetchData();
  };

  const handleToggleActive = async (item: CombinedProduct) => {
    const { error } = await supabase
      .from("stock_product_whitelist")
      .update({ ativo: !item.product.ativo })
      .eq("id", item.product.id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(item.product.ativo ? "Produto desativado!" : "Produto ativado!");
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
      </div>
    );
  }

  return (
    <>
      <Card className="bg-dashboard-card border-dashboard-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos & Kits
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Gerencie produtos e configuração de kits em uma única tabela
            </CardDescription>
          </div>
          <Button size="sm" className="bg-dashboard-accent text-dashboard-dark" onClick={handleOpenNew}>
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
                <TableHead className="text-muted-foreground text-center">Qtd por Kit</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinedList.map((item) => (
                <TableRow key={item.product.id} className="border-dashboard-border">
                  <TableCell className="text-foreground font-mono text-sm">{item.product.product_code}</TableCell>
                  <TableCell className="text-foreground">{item.product.product_name || "-"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={item.product.ativo ? "default" : "secondary"} className={item.product.ativo ? "bg-green-500/20 text-green-400" : ""}>
                      {item.product.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-dashboard-accent border-dashboard-accent/50">
                      {item.kit?.kit_quantity || 1} un.
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleToggleActive(item)} title={item.product.ativo ? "Desativar" : "Ativar"}>
                      <Checkbox checked={item.product.ativo} className="cursor-pointer" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item)} title="Deletar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {combinedList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum produto cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-dashboard-card border-dashboard-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingProduct ? "Editar" : "Novo"} Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground text-sm">Código do Produto</Label>
              <Input
                value={form.product_code}
                onChange={(e) => setForm({ ...form, product_code: e.target.value })}
                className="bg-dashboard-dark border-dashboard-border text-foreground text-sm mt-1"
                placeholder="Ex: 099M0018"
              />
            </div>
            <div>
              <Label className="text-foreground text-sm">Nome do Produto</Label>
              <Input
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                className="bg-dashboard-dark border-dashboard-border text-foreground text-sm mt-1"
                placeholder="Ex: Kit Restaurante"
              />
            </div>
            <div>
              <Label className="text-foreground text-sm">Quantidade por Kit</Label>
              <Input
                type="number"
                min={1}
                value={form.kit_quantity}
                onChange={(e) => setForm({ ...form, kit_quantity: parseInt(e.target.value) || 1 })}
                className="bg-dashboard-dark border-dashboard-border text-foreground text-sm mt-1"
                placeholder="Ex: 10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="product-ativo"
                checked={form.ativo}
                onCheckedChange={(checked) => setForm({ ...form, ativo: checked as boolean })}
              />
              <label htmlFor="product-ativo" className="text-sm text-foreground cursor-pointer">
                Ativo
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-dashboard-border">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-dashboard-accent text-dashboard-dark">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StockProductsManager;
