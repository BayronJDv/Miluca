import { useState } from 'react';
import { crearProducto, obtenerProductos, Producto } from './db/products';

export default function TestDB() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [estado, setEstado]       = useState('');

  async function probarInsertar() {
    try {
      await crearProducto({ name: 'Coca Cola', code: 1, price: 2500, cost: 2000, stock: 10 });
      await crearProducto({ name: 'Pan',       code: 2, price:  800, cost: 700, stock: 50 });
      setEstado('✅ Productos insertados');
    } catch (e) {
      setEstado(`❌ Error: ${e}`);
    }
  }

  async function probarConsultar() {
    try {
      const lista = await obtenerProductos();
      setProductos(lista);
      setEstado(`✅ ${lista.length} productos encontrados`);
    } catch (e) {
      setEstado(`❌ Error: ${e}`);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Test de base de datos</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={probarInsertar}>Insertar productos</button>
        <button onClick={probarConsultar}>Consultar productos</button>
      </div>

      <p>{estado}</p>

      {productos.length > 0 && (
        <table border={1} cellPadding={8}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Costo</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>${p.price}</td>
                <td>${p.cost}</td>
                <td>{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}