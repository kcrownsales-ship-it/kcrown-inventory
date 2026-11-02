export type Product = { id: string; model: string; material: string; length: string; color: string; system: string; capacity: number; sku: string };
const rows: [string,string,string,string,number][] = [
["HI-CAPA","Aluminum","Short","MARUI",31],["HI-CAPA","Aluminum","Long","MARUI",50],
["HI-CAPA","Zinc alloy","Short","MARUI",31],["HI-CAPA","Zinc alloy","Long","MARUI",50],
["M4 MWS","Aluminum","Standard","MARUI",38],
["GLOCK","Zinc","Short","MARUI",35],["GLOCK","Zinc","Long","MARUI",50],
["GLOCK","Aluminum","Short","MARUI",35],["GLOCK","Aluminum","Long","MARUI",50],
["P320","Zinc alloy","Short","VFC",20],["P320","Zinc alloy","Long","VFC",25],
["P320","Aluminum","Short","MARUI",32],
["M4 T10101","Plastic","Standard","AEG",240],["M4 T10201","Plastic","Standard","AEG",240],["M4 T10203","Plastic","Standard","AEG",240]];
export const catalogue: Product[] = rows.flatMap((r,i)=>["黑色（示範）","沙色（示範）"].map((color,j)=>({id:`p${i}-${j}`,model:r[0],material:r[1],length:r[2],system:r[3],capacity:r[4],color,sku:`KC-${String(i+1).padStart(3,"0")}-${j?"TAN":"BLK"}`})));
