import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCityMapping, CityMapping } from "@/hooks/useCityMapping";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";

interface CityMappingCRUDProps {
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
}

export const CityMappingCRUD = ({ canEdit, canCreate, canDelete }: CityMappingCRUDProps) => {
  const { cities, loading, createCity, updateCity, deleteCity } = useCityMapping();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityMapping | null>(null);
  const [form, setForm] = useState({ cidade: "", regional: "", uf: "" });

  const filteredCities = useMemo(() => {
    if (!search) return cities;
    const s = search.toLowerCase();
    return cities.filter(
      c => c.cidade.toLowerCase().includes(s) || c.regional.toLowerCase().includes(s) || c.uf.toLowerCase().includes(s)
    );
  }, [cities, search]);

  // Stats
  const stats = useMemo(() => {
    const ufs = new Set(cities.map(c => c.uf));
    const regionais = new Set(cities.map(c => c.regional));
    return { total: cities.length, ufs: ufs.size, regionais: regionais.size };
  }, [cities]);

  const handleOpenNew = () => {
    setEditingCity(null);
    setForm({ cidade: "", regional: "", uf: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (city: CityMapping) => {
    setEditingCity(city);
    setForm({ cidade: city.cidade, regional: city.regional, uf: city.uf });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.cidade.trim() || !form.regional.trim() || !form.uf.trim()) {
      return;
    }
    if (editingCity) {
      await updateCity(editingCity.id, form.cidade.trim(), form.regional.trim(), form.uf.trim());
    } else {
      await createCity(form.cidade.trim(), form.regional.trim(), form.uf.trim());
    }
    setIsDialogOpen(false);
    setEditingCity(null);
  };

  const handleDelete = async (id: string) => {
    await deleteCity(id);
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
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-base text-foreground">Cadastro de Cidades</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="bg-dashboard-accent/20 text-dashboard-accent">
                {stats.total} cidades
              </Badge>
              <Badge variant="secondary" className="bg-dashboard-blue/20 text-dashboard-blue">
                {stats.ufs} UFs
              </Badge>
              <Badge variant="secondary" className="bg-dashboard-orange/20 text-dashboard-orange">
                {stats.regionais} regionais
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cidade, regional ou UF..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-dashboard-dark border-dashboard-border text-foreground w-64"
              />
            </div>
            {canCreate && (
              <Button size="sm" className="bg-dashboard-accent text-dashboard-dark" onClick={handleOpenNew}>
                <Plus className="h-4 w-4 mr-1" /> Nova Cidade
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-dashboard-border">
                  <TableHead className="text-muted-foreground">Cidade</TableHead>
                  <TableHead className="text-muted-foreground">Regional</TableHead>
                  <TableHead className="text-muted-foreground">UF</TableHead>
                  <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCities.map(city => (
                  <TableRow key={city.id} className="border-dashboard-border">
                    <TableCell className="text-foreground">{city.cidade}</TableCell>
                    <TableCell className="text-muted-foreground">{city.regional}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-dashboard-border text-foreground">
                        {city.uf}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(city)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(city.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {search ? "Nenhuma cidade encontrada" : "Nenhuma cidade cadastrada"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-dashboard-card border-dashboard-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingCity ? "Editar" : "Nova"} Cidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">Cidade</Label>
              <Input
                value={form.cidade}
                onChange={e => setForm({ ...form, cidade: e.target.value })}
                className="bg-dashboard-dark border-dashboard-border text-foreground"
                placeholder="Ex: São Paulo"
              />
            </div>
            <div>
              <Label className="text-foreground">Regional</Label>
              <Input
                value={form.regional}
                onChange={e => setForm({ ...form, regional: e.target.value })}
                className="bg-dashboard-dark border-dashboard-border text-foreground"
                placeholder="Ex: Sao Paulo"
              />
            </div>
            <div>
              <Label className="text-foreground">UF</Label>
              <Input
                value={form.uf}
                onChange={e => setForm({ ...form, uf: e.target.value })}
                className="bg-dashboard-dark border-dashboard-border text-foreground"
                placeholder="Ex: SP"
                maxLength={2}
              />
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
