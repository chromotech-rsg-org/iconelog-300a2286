import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  product_code: string;
  product_name: string | null;
  ativo: boolean;
  unified_code: string | null;
  foto_url: string | null;
  kit_completo: boolean;
  kit_basico: boolean;
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
  unified_code: string;
}

export const StockProductsManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CombinedProduct | null>(null);
  const [form, setForm] = useState<ProductForm>({ product_code: "", product_name: "", ativo: true, kit_quantity: 1, unified_code: "" });

  const [photoMap, setPhotoMap] = useState<Map<string, string>>(new Map());

  const fetchData = async () => {
    setLoading(true);
    const [prodRes, kitRes, cacheRes] = await Promise.all([
      supabase.from("stock_product_whitelist").select("*").order("product_code"),
      supabase.from("stock_kit_config").select("*").order("sku_code"),
      supabase.from("bi_data_cache").select("data").eq("page_id", "_shared").eq("cache_key", "mapalogistico_099").maybeSingle(),
    ]);
    setProducts((prodRes.data as Product[]) || []);
    setKits((kitRes.data as Kit[]) || []);

    // Build photo map from mapa logístico cache
    if (cacheRes.data?.data) {
      const map = new Map<string, string>();
      const items = cacheRes.data.data as any[];
      for (const item of items) {
        const code = (item.produto || "").toString().trim();
        const foto = (item.foto_produto || "").toString().trim();
        if (code && foto) map.set(code, foto);
      }
      setPhotoMap(map);
    }

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

  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return combinedList;
    const term = searchTerm.toLowerCase();
    return combinedList.filter(item =>
      item.product.product_code.toLowerCase().includes(term) ||
      (item.product.product_name || "").toLowerCase().includes(term)
    );
  }, [combinedList, searchTerm]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filteredList.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleOpenNew = () => {
    setEditingProduct(null);
    setForm({ product_code: "", product_name: "", ativo: true, kit_quantity: 1, unified_code: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: CombinedProduct) => {
    setEditingProduct(item);
    setForm({
      product_code: item.product.product_code,
      product_name: item.product.product_name || "",
      ativo: item.product.ativo,
      kit_quantity: item.kit?.kit_quantity || 1,
      unified_code: item.product.unified_code || "",
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
    const unifiedCode = form.unified_code.trim() || null;

    if (editingProduct) {
      const { error: prodErr } = await supabase
        .from("stock_product_whitelist")
        .update({ product_code: code, product_name: name, ativo: form.ativo, unified_code: unifiedCode })
        .eq("id", editingProduct.product.id);
      if (prodErr) { toast.error("Erro: " + prodErr.message); return; }

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
      const { error: prodErr } = await supabase.from("stock_product_whitelist")
        .insert({ product_code: code, product_name: name, ativo: form.ativo, unified_code: unifiedCode });
      if (prodErr) { toast.error("Erro: " + prodErr.message); return; }

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
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos & Kits
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {filteredList.length} registros
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mostrar:</span>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-20 h-8 bg-dashboard-dark border-dashboard-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dashboard-card border-dashboard-border">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9 h-8 bg-dashboard-dark border-dashboard-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button size="sm" className="bg-dashboard-accent text-dashboard-dark" onClick={handleOpenNew}>
                <Plus className="h-4 w-4 mr-1" /> Novo Produto
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-dashboard-border">
                <TableHead className="text-muted-foreground w-16">Foto</TableHead>
                <TableHead className="text-muted-foreground">Código</TableHead>
                <TableHead className="text-muted-foreground">Nome</TableHead>
                <TableHead className="text-muted-foreground">Prod. Unificado</TableHead>
                <TableHead className="text-muted-foreground text-center">Status</TableHead>
                <TableHead className="text-muted-foreground text-center">Qtd por Kit</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedList.map((item) => (
                <TableRow key={item.product.id} className="border-dashboard-border">
                  <TableCell className="py-1">
                    <div className="w-10 h-10 rounded bg-white flex items-center justify-center overflow-hidden">
                      {(() => {
                        const imgUrl = item.product.foto_url || photoMap.get(item.product.product_code) || "";
                        return imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={item.product.product_name || item.product.product_code}
                            className="w-full h-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted-foreground"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>'; }}
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground font-mono text-sm">{item.product.product_code}</TableCell>
                  <TableCell className="text-foreground">{item.product.product_name || "-"}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{item.product.unified_code || "-"}</TableCell>
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
              {paginatedList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-dashboard-border mt-2">
              <span className="text-sm text-muted-foreground">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredList.length)} de {filteredList.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {getPageNumbers().map((page, i) =>
                  typeof page === "string" ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="icon"
                      className={`h-8 w-8 ${currentPage === page ? "bg-dashboard-accent text-dashboard-dark" : "text-muted-foreground"}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-dashboard-card border-dashboard-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingProduct ? "Editar" : "Novo"} Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Photo preview (read-only) */}
            {(() => {
              const code = form.product_code.trim();
              const imgUrl = editingProduct?.product.foto_url || photoMap.get(code) || "";
              return imgUrl ? (
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded bg-white flex items-center justify-center overflow-hidden border border-dashboard-border">
                    <img src={imgUrl} alt={form.product_name || code} className="w-full h-full object-contain" />
                  </div>
                </div>
              ) : null;
            })()}
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
            <div>
              <Label className="text-foreground text-sm">Produtos Unificados</Label>
              <Input
                value={form.unified_code}
                onChange={(e) => setForm({ ...form, unified_code: e.target.value })}
                className="bg-dashboard-dark border-dashboard-border text-foreground text-sm mt-1"
                placeholder="Código para agrupar produtos (ex: KIT-A)"
              />
              <p className="text-xs text-muted-foreground mt-1">Produtos com o mesmo código unificado terão seus kits somados no cálculo de Kits Completo.</p>
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
