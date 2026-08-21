-- =============================================================
-- SCRIPT: Datos de prueba completos para farmacia POS
-- Motor: SQLite
-- Uso: Conectar desde DBViewer y ejecutar este script completo
-- IMPORTANTE: Ejecutar sobre una BD recién creada (borrar .db primero)
-- =============================================================

PRAGMA foreign_keys = ON;

-- =============================================================
-- 1. USUARIOS
-- =============================================================
INSERT INTO users (username, password, role) VALUES
  ('carlos',  'carlos123',  'admin'),
  ('maria',   'maria123',   'seller'),
  ('jose',    'jose123',    'seller'),
  ('ana',     'ana123',     'seller'),
  ('pedro',   'pedro123',   'admin'),
  ('laura',   'laura123',   'seller'),
  ('diego',   'diego123',   'seller'),
  ('sofia',   'sofia123',   'seller');

-- =============================================================
-- 2. PROVEEDORES
-- =============================================================
INSERT INTO suppliers (name, photo_route, contact_info, nit, address, email) VALUES
  ('Drogueria La Rebaja', NULL, '6013456789', '830012345-6', 'Cra 15 #32-10, Bogota', 'ventas@larebaja.com'),
  ('Distribuidora Farmaceutica Nacional', NULL, '6014567890', '800198765-4', 'Calle 72 #10-25, Bogota', 'pedidos@difarnac.com'),
  ('Cruz Verde S.A.', NULL, '6015678901', '860004532-1', 'Av 68 #53-41, Bogota', 'compras@cruzverde.com'),
  ('Drogas La Rebaja', NULL, '6016789012', '899999123-0', 'Cra 7 #33-16, Medellin', 'mayorista@dlr.com.co'),
  ('Distrifarma Plus', NULL, '6017890123', '900123456-7', 'Calle 45 #7-80, Cali', 'ventas@distrifarma.co'),
  ('Medisanitas Colombia', NULL, '6018901234', '800876543-2', 'Av El Dorado #68-65, Bogota', 'info@medisanitas.co'),
  ('PharmaCol Suministros', NULL, '6019012345', '901234567-8', 'Cra 13 #28-18, Bogota', 'ventas@pharmacol.co'),
  ('Genfar Colombia', NULL, '6010123456', '830054321-9', 'Calle 17 #23-50, Medellin', 'pedidos@genfar.co'),
  ('Laboratorios La Francia', NULL, '6011234567', '800112233-4', 'Av 19 #12-68, Bogota', 'ventas@lafrancia.co'),
  ('Distribuciones Medicas del Norte', NULL, '6012345678', '900998877-6', 'Cra 43 #78-15, Medellin', 'info@dimedno.com'),
  ('Farmatodo S.A.', NULL, '6013456780', '811223344-5', 'Calle 80 #12-45, Bogota', 'compras@farmatodo.co'),
  ('Drogueria Olimpica', NULL, '6014567801', '822334455-6', 'Av 68 #24-80, Bogota', 'mayorista@olimpica.co');

-- =============================================================
-- 3. PRODUCTOS (70 productos)
-- =============================================================
INSERT INTO products (
  name, code, price, alert_stock, generic_name, active_ingredient,
  dosage_form, concentration, presentation, manufacturer, category,
  requires_prescription, requires_lot_control, has_invima, invima_info,
  wholesale_price, wholesale_min_qty
) VALUES
  -- MEDICAMENTOS (40)
  ('Paracetamol 500mg', 'MED001', 3500, 20, 'Paracetamol', 'Paracetamol',
   'Tableta', '500 mg', 'Caja x 20 tabletas', 'Genfar', 'medicamento',
   0, 1, 1, 'INVIMA 2005M-0005601', 2800, 10),

  ('Ibuprofeno 400mg', 'MED002', 5200, 15, 'Ibuprofeno', 'Ibuprofeno',
   'Tableta', '400 mg', 'Caja x 20 tabletas', 'MK', 'medicamento',
   0, 1, 1, 'INVIMA 2008M-0012345', 4200, 10),

  ('Amoxicilina 500mg', 'MED003', 8500, 10, 'Amoxicilina', 'Amoxicilina Trihidrato',
   'Capsula', '500 mg', 'Caja x 21 capsulas', 'La Francia', 'medicamento',
   1, 1, 1, 'INVIMA 2006M-0007890', 7000, 8),

  ('Omeprazol 20mg', 'MED004', 12000, 12, 'Omeprazol', 'Omeprazol',
   'Capsula', '20 mg', 'Caja x 28 capsulas', 'Genfar', 'medicamento',
   0, 1, 1, 'INVIMA 2007M-0009876', 9500, 8),

  ('Losartan 50mg', 'MED005', 15000, 8, 'Losartan Potasico', 'Losartan',
   'Tableta', '50 mg', 'Caja x 30 tabletas', 'Abbott', 'medicamento',
   1, 1, 1, 'INVIMA 2004M-0003456', 12000, 6),

  ('Metformina 850mg', 'MED006', 9800, 10, 'Metformina', 'Clorhidrato de Metformina',
   'Tableta', '850 mg', 'Caja x 30 tabletas', 'Merck', 'medicamento',
   1, 1, 1, 'INVIMA 2003M-0001234', 7800, 8),

  ('Azitromicina 500mg', 'MED007', 18000, 6, 'Azitromicina', 'Azitromicina Dihidrato',
   'Tableta', '500 mg', 'Caja x 3 tabletas', 'Pfizer', 'medicamento',
   1, 1, 1, 'INVIMA 2009M-0015678', 14500, 6),

  ('Diclofenaco 100mg', 'MED008', 6500, 15, 'Diclofenaco', 'Diclofenaco Sodico',
   'Tableta', '100 mg', 'Caja x 20 tabletas', 'Synlab', 'medicamento',
   0, 1, 1, 'INVIMA 2006M-0008765', 5200, 10),

  ('Clonazepam 2mg', 'MED009', 22000, 5, 'Clonazepam', 'Clonazepam',
   'Tableta', '2 mg', 'Caja x 30 tabletas', 'Roche', 'medicamento',
   1, 1, 1, 'INVIMA 2002M-0002345', 18000, 5),

  ('Salbutamol Inhalador', 'MED010', 35000, 4, 'Salbutamol', 'Sulfato de Salbutamol',
   'Inhalador', '100 mcg/dosis', 'Inhalador x 200 dosis', 'GSK', 'medicamento',
   1, 0, 1, 'INVIMA 2001M-0006789', 28000, 3),

  ('Dexametasona 4mg', 'MED011', 7200, 8, 'Dexametasona', 'Fosfato Sodico de Dexametasona',
   'Tableta', '4 mg', 'Caja x 20 tabletas', 'Genfar', 'medicamento',
   1, 1, 1, 'INVIMA 2005M-0004321', 5800, 6),

  ('Ranitidina 150mg', 'MED012', 4800, 12, 'Ranitidina', 'Clorhidrato de Ranitidina',
   'Tableta', '150 mg', 'Caja x 30 tabletas', 'La Francia', 'medicamento',
   0, 1, 1, 'INVIMA 2004M-0005678', 3800, 10),

  ('Naproxeno 250mg', 'MED013', 7500, 10, 'Naproxeno', 'Naproxeno Sodico',
   'Tableta', '250 mg', 'Caja x 20 tabletas', 'Bayer', 'medicamento',
   0, 1, 1, 'INVIMA 2007M-0011234', 6000, 8),

  ('Ciprofloxacino 500mg', 'MED014', 11000, 6, 'Ciprofloxacino', 'Clorhidrato de Ciprofloxacino',
   'Tableta', '500 mg', 'Caja x 14 tabletas', 'Bayer', 'medicamento',
   1, 1, 1, 'INVIMA 2006M-0009012', 8800, 6),

  ('Prednisona 20mg', 'MED015', 4200, 15, 'Prednisona', 'Prednisona',
   'Tableta', '20 mg', 'Caja x 20 tabletas', 'Synlab', 'medicamento',
   1, 1, 1, 'INVIMA 2003M-0004567', 3400, 10),

  ('Cetirizina 10mg', 'MED016', 5500, 12, 'Cetirizina', 'Clorhidrato de Cetirizina',
   'Tableta', '10 mg', 'Caja x 10 tabletas', 'Genfar', 'medicamento',
   0, 1, 1, 'INVIMA 2007M-0013456', 4400, 8),

  ('Loratadina 10mg', 'MED017', 6200, 10, 'Loratadina', 'Loratadina',
   'Tableta', '10 mg', 'Caja x 10 tabletas', 'MK', 'medicamento',
   0, 1, 1, 'INVIMA 2008M-0014567', 5000, 8),

  ('Pantoprazol 40mg', 'MED018', 14500, 6, 'Pantoprazol', 'Pantoprazol Sodico',
   'Tableta', '40 mg', 'Caja x 28 tabletas', 'Wyeth', 'medicamento',
   1, 1, 1, 'INVIMA 2006M-0015678', 11500, 5),

  ('Fluoxetina 20mg', 'MED019', 16000, 5, 'Fluoxetina', 'Clorhidrato de Fluoxetina',
   'Capsula', '20 mg', 'Caja x 30 capsulas', 'Eli Lilly', 'medicamento',
   1, 1, 1, 'INVIMA 2004M-0016789', 12800, 4),

  ('Atorvastatina 20mg', 'MED020', 19000, 5, 'Atorvastatina', 'Atorvastatina Calcica',
   'Tableta', '20 mg', 'Caja x 30 tabletas', 'Pfizer', 'medicamento',
   1, 1, 1, 'INVIMA 2005M-0017890', 15200, 4),

  ('Amlodipino 5mg', 'MED021', 8500, 8, 'Amlodipino', 'Besilato de Amlodipino',
   'Tableta', '5 mg', 'Caja x 30 tabletas', 'Pfizer', 'medicamento',
   1, 1, 1, 'INVIMA 2006M-0018901', 6800, 6),

  ('Metoprolol 50mg', 'MED022', 7800, 8, 'Metoprolol', 'Tartrato de Metoprolol',
   'Tableta', '50 mg', 'Caja x 30 tabletas', 'AstraZeneca', 'medicamento',
   1, 1, 1, 'INVIMA 2007M-0019012', 6200, 6),

  ('Enalapril 10mg', 'MED023', 5600, 10, 'Enalapril', 'Maleato de Enalapril',
   'Tableta', '10 mg', 'Caja x 20 tabletas', 'Merck', 'medicamento',
   1, 1, 1, 'INVIMA 2008M-0020123', 4500, 8),

  ('Captopril 25mg', 'MED024', 3200, 15, 'Captopril', 'Captopril',
   'Tableta', '25 mg', 'Caja x 20 tabletas', 'Genfar', 'medicamento',
   1, 1, 1, 'INVIMA 2009M-0021234', 2600, 10),

  ('Hidroclorotiazida 25mg', 'MED025', 3800, 12, 'Hidroclorotiazida', 'Hidroclorotiazida',
   'Tableta', '25 mg', 'Caja x 20 tabletas', 'Synlab', 'medicamento',
   1, 1, 1, 'INVIMA 2010M-0022345', 3000, 10),

  ('Warfarina 5mg', 'MED026', 6500, 4, 'Warfarina', 'Warfarina Sodica',
   'Tableta', '5 mg', 'Caja x 30 tabletas', 'Bayer', 'medicamento',
   1, 1, 1, 'INVIMA 2003M-0023456', 5200, 4),

  ('Insulina NPH 100UI/ml', 'MED027', 45000, 3, 'Insulina NPH', 'Insulina Humana NPH',
   'Solucion Inyectable', '100 UI/ml', 'Frasco x 10 ml', 'Novo Nordisk', 'medicamento',
   1, 1, 1, 'INVIMA 2002M-0024567', 36000, 2),

  ('Metformina 500mg', 'MED028', 5200, 15, 'Metformina', 'Clorhidrato de Metformina',
   'Tableta', '500 mg', 'Caja x 30 tabletas', 'Merck', 'medicamento',
   1, 1, 1, 'INVIMA 2003M-0025678', 4200, 10),

  ('Glibenclamida 5mg', 'MED029', 3500, 10, 'Glibenclamida', 'Glibenclamida',
   'Tableta', '5 mg', 'Caja x 30 tabletas', 'Genfar', 'medicamento',
   1, 1, 1, 'INVIMA 2004M-0026789', 2800, 8),

  ('Levotiroxina 50mcg', 'MED030', 12000, 6, 'Levotiroxina', 'Levotiroxina Sodica',
   'Tableta', '50 mcg', 'Caja x 30 tabletas', 'Merck', 'medicamento',
   1, 1, 1, 'INVIMA 2005M-0027890', 9600, 5),

  ('Acetaminofen Jarabe', 'MED031', 4500, 10, 'Paracetamol', 'Paracetamol',
   'Jarabe', '120 mg/5ml', 'Frasco x 120 ml', 'Genfar', 'medicamento',
   0, 1, 1, 'INVIMA 2006M-0028901', 3600, 8),

  ('Ibuprofeno Jarabe', 'MED032', 5800, 8, 'Ibuprofeno', 'Ibuprofeno',
   'Jarabe', '200 mg/5ml', 'Frasco x 100 ml', 'MK', 'medicamento',
   0, 1, 1, 'INVIMA 2007M-0029012', 4600, 6),

  ('Amoxicilina Suspension', 'MED033', 9200, 6, 'Amoxicilina', 'Amoxicilina Trihidrato',
   'Suspension Oral', '250 mg/5ml', 'Frasco x 100 ml', 'La Francia', 'medicamento',
   1, 1, 1, 'INVIMA 2008M-0030123', 7400, 5),

  ('Ceftriaxona 1g', 'MED034', 28000, 3, 'Ceftriaxona', 'Ceftriaxona Sodica',
   'Polvo Inyectable', '1 g', 'Frasco', 'Roche', 'medicamento',
   1, 1, 1, 'INVIMA 2009M-0031234', 22400, 2),

  ('Diclofenaco Gel', 'MED035', 8800, 8, 'Diclofenaco', 'Diclofenaco Dietilamina',
   'Gel', '1%', 'Tubo x 60g', 'Synlab', 'medicamento',
   0, 0, 1, 'INVIMA 2010M-0032345', 7000, 6),

  ('Miconazol Crema', 'MED036', 7200, 8, 'Miconazol', 'Nitrato de Miconazol',
   'Crema', '2%', 'Tubo x 30g', 'Genfar', 'medicamento',
   0, 0, 1, 'INVIMA 2011M-0033456', 5800, 6),

  ('Permetrina Crema', 'MED037', 11000, 5, 'Permetrina', 'Permetrina',
   'Crema', '5%', 'Tubo x 60g', 'Pfizer', 'medicamento',
   0, 0, 1, 'INVIMA 2012M-0034567', 8800, 4),

  ('Neomicina Gotas', 'MED038', 6800, 6, 'Neomicina', 'Sulfato de Neomicina',
   'Gotas', '0.5%', 'Frasco x 15 ml', 'Abbott', 'medicamento',
   0, 1, 1, 'INVIMA 2013M-0035678', 5400, 5),

  ('Timolol Gotas', 'MED039', 15500, 4, 'Timolol', 'Maleato de Timolol',
   'Gotas Oftalmicas', '0.5%', 'Frasco x 5 ml', 'Merck', 'medicamento',
   1, 1, 1, 'INVIMA 2014M-0036789', 12400, 3),

  ('Metronidazol 500mg', 'MED040', 5800, 10, 'Metronidazol', 'Metronidazol',
   'Tableta', '500 mg', 'Caja x 20 tabletas', 'Synlab', 'medicamento',
   1, 1, 1, 'INVIMA 2015M-0037890', 4600, 8),

  ('Tramadol 50mg', 'MED041', 12500, 4, 'Tramadol', 'Clorhidrato de Tramadol',
   'Capsula', '50 mg', 'Caja x 30 capsulas', 'Grunenthal', 'medicamento',
   1, 1, 1, 'INVIMA 2016M-0038901', 10000, 3),

  ('Morfina 10mg', 'MED042', 35000, 2, 'Morfina', 'Sulfato de Morfina',
   'Comprimido', '10 mg', 'Caja x 20 comprimidos', 'ABOCIA', 'medicamento',
   1, 1, 1, 'INVIMA 2017M-0039012', 28000, 2),

  ('Diazepam 10mg', 'MED043', 8500, 6, 'Diazepam', 'Diazepam',
   'Tableta', '10 mg', 'Caja x 30 tabletas', 'Roche', 'medicamento',
   1, 1, 1, 'INVIMA 2018M-0040123', 6800, 4),

  ('Sildenafil 50mg', 'MED044', 28000, 3, 'Sildenafil', 'Citrato de Sildenafil',
   'Tableta', '50 mg', 'Caja x 4 tabletas', 'Pfizer', 'medicamento',
   1, 1, 1, 'INVIMA 2019M-0041234', 22400, 2),

  ('Ondansetron 4mg', 'MED045', 9500, 5, 'Ondansetron', 'Clorhidrato de Ondansetron',
   'Tableta', '4 mg', 'Caja x 10 tabletas', 'Glaxo', 'medicamento',
   1, 1, 1, 'INVIMA 2020M-0042345', 7600, 4),

  ('Seroquel 100mg', 'MED046', 42000, 2, 'Quetiapina', 'Fumarato de Quetiapina',
   'Tableta', '100 mg', 'Caja x 60 tabletas', 'AstraZeneca', 'medicamento',
   1, 1, 1, 'INVIMA 2021M-0043456', 33600, 2),

  ('Risperidona 2mg', 'MED047', 18000, 4, 'Risperidona', 'Risperidona',
   'Tableta', '2 mg', 'Caja x 30 tabletas', 'Janssen', 'medicamento',
   1, 1, 1, 'INVIMA 2022M-0044567', 14400, 3),

  ('Carbamazepina 200mg', 'MED048', 8500, 6, 'Carbamazepina', 'Carbamazepina',
   'Tableta', '200 mg', 'Caja x 30 tabletas', 'Novartis', 'medicamento',
   1, 1, 1, 'INVIMA 2023M-0045678', 6800, 4),

  ('Fenitoina 100mg', 'MED049', 5200, 6, 'Fenitoina', 'Fenitoina Sodica',
   'Capsula', '100 mg', 'Caja x 30 capsulas', 'Pfizer', 'medicamento',
   1, 1, 1, 'INVIMA 2024M-0046789', 4200, 4),

  ('Valproato 500mg', 'MED050', 12000, 4, 'Acido Valproico', 'Valproato de Sodio',
   'Tableta', '500 mg', 'Caja x 30 tabletas', 'Sanofi', 'medicamento',
   1, 1, 1, 'INVIMA 2025M-0047890', 9600, 3),

  -- DISPOSITIVOS MEDICOS (10)
  ('Jeringa 5ml', 'DM001', 800, 50, NULL, NULL,
   'Jeringa', '5 ml', 'Caja x 100 unidades', 'BD', 'dispositivo_medico',
   0, 0, 1, 'INVIMA 2010D-0001234', 600, 20),

  ('Jeringa 10ml', 'DM002', 1200, 30, NULL, NULL,
   'Jeringa', '10 ml', 'Caja x 100 unidades', 'BD', 'dispositivo_medico',
   0, 0, 1, 'INVIMA 2010D-0001235', 900, 15),

  ('Guantes Talla M', 'DM003', 18000, 10, NULL, NULL,
   'Guante', 'Talla M', 'Caja x 100 unidades', 'Top Glove', 'dispositivo_medico',
   0, 0, 1, 'INVIMA 2011D-0005678', 14500, 5),

  ('Guantes Talla L', 'DM004', 18000, 10, NULL, NULL,
   'Guante', 'Talla L', 'Caja x 100 unidades', 'Top Glove', 'dispositivo_medico',
   0, 0, 1, 'INVIMA 2011D-0005679', 14500, 5),

  ('Termometro Digital', 'DM005', 25000, 5, NULL, NULL,
   'Termometro', 'Digital', 'Unidad', 'Omron', 'dispositivo_medico',
   0, 0, 1, 'INVIMA 2012D-0009012', 20000, 3),

  ('Tensiotometro Digital', 'DM006', 85000, 3, NULL, NULL,
   'Tensiotometro', 'Digital', 'Unidad', 'Omron', 'dispositivo_medico',
   0, 0, 1, 'INVIMA 2013D-0003456', 68000, 2),

  ('Mascarilla Quirurgica', 'DM007', 12000, 20, NULL, NULL,
   'Mascarilla', 'Quirurgica', 'Caja x 50 unidades', '3M', 'dispositivo_medico',
   0, 0, 1, 'INVIMA 2014D-0007890', 9500, 10),

  ('Alcohol Gel 500ml', 'DM008', 8500, 15, NULL, 'Alcohol Etilico 70%',
   'Gel', '500 ml', 'Frasco con dispensador', '702', 'dispositivo_medico',
   0, 0, 1, 'INVIMA 2015D-0011234', 6800, 8),

  ('Gasas Esteriles', 'DM009', 3500, 20, NULL, NULL,
   'Gasas', '10x10 cm', 'Caja x 100 unidades', '3M', 'dispositivo_medico',
   0, 0, 1, 'INVIMA 2016D-0012345', 2800, 10),

  ('Estetoscopio Littmann', 'DM010', 120000, 2, NULL, NULL,
   'Estetoscopio', 'Cardiologico', 'Unidad', '3M Littmann', 'dispositivo_medico',
   0, 0, 1, 'INVIMA 2018D-0014567', 96000, 1),

  ('Oximetro de Pulso', 'DM011', 55000, 3, NULL, NULL,
   'Oximetro', 'Digital', 'Unidad', 'Nonin', 'dispositivo_medico',
   0, 0, 1, 'INVIMA 2019D-0015678', 44000, 2),

  ('Nebulizador Portatil', 'DM012', 95000, 2, NULL, NULL,
   'Nebulizador', 'Portatil', 'Unidad', 'Omron', 'dispositivo_medico',
   0, 0, 1, 'INVIMA 2021D-0017890', 76000, 1),

  -- COSMETICOS (5)
  ('Protector Solar FPS 50', 'COS001', 28000, 8, NULL, 'Oxido de Zinc',
   'Crema', 'FPS 50', 'Tubo x 100ml', 'La Roche-Posay', 'cosmetico',
   0, 0, 1, 'INVIMA 2015C-0002345', 22000, 4),

  ('Shampoo Anticaspa', 'COS002', 18500, 10, NULL, 'Piroctona Olamina',
   'Shampoo', '200 ml', 'Unidad', 'Head & Shoulders', 'cosmetico',
   0, 0, 1, 'INVIMA 2016C-0006789', 15000, 6),

  ('Crema Hidratante Facial', 'COS003', 32000, 5, NULL, 'Acido Hialuronico',
   'Crema', '50 ml', 'Tarro', 'Eucerin', 'cosmetico',
   0, 0, 1, 'INVIMA 2017C-0007890', 25600, 3),

  ('Bloqueador Solar FPS 70', 'COS004', 38000, 4, NULL, 'Avobenzone',
   'Crema', 'FPS 70', 'Tubo x 120ml', 'Isdin', 'cosmetico',
   0, 0, 1, 'INVIMA 2018C-0008901', 30400, 3),

  ('Crema Antiacne', 'COS005', 22000, 5, NULL, 'Peroxido de Benzoilo',
   'Crema', '5%', 'Tubo x 30g', 'Benzac', 'cosmetico',
   0, 0, 1, 'INVIMA 2020C-0010123', 17600, 4),

  -- ALIMENTOS / SUPLEMENTOS (5)
  ('Vitamina C 1000mg', 'ALI001', 22000, 10, 'Acido Ascorbico', 'Acido Ascorbico',
   'Tableta Efervescente', '1000 mg', 'Tubo x 20 tabletas', 'Redoxon', 'alimento',
   0, 1, 1, 'INVIMA 2017A-0001234', 17500, 6),

  ('Suplemento Vitaminico', 'ALI002', 35000, 5, 'Multivitaminico', 'Complejo Vitaminico',
   'Capsula', 'Complejo', 'Frasco x 60 capsulas', 'Centrum', 'alimento',
   0, 1, 1, 'INVIMA 2018A-0005678', 28000, 3),

  ('Vitamina D3 4000UI', 'ALI003', 28000, 6, 'Colecalciferol', 'Vitamina D3',
   'Capsula', '4000 UI', 'Frasco x 30 capsulas', 'D-Cure', 'alimento',
   0, 1, 1, 'INVIMA 2019A-0006789', 22400, 4),

  ('Omega 3 1000mg', 'ALI004', 32000, 5, 'Aceite de Pescado', 'EPA/DHA',
   'Capsula', '1000 mg', 'Frasco x 60 capsulas', 'TerraNova', 'alimento',
   0, 1, 1, 'INVIMA 2020A-0007890', 25600, 3),

  ('Probioticos 10 mil millones', 'ALI005', 38000, 4, 'Probioticos', 'Lactobacillus',
   'Capsula', '10 mil millones CFU', 'Frasco x 30 capsulas', 'Lacteol', 'alimento',
   0, 1, 1, 'INVIMA 2023A-0010123', 30400, 3);

-- =============================================================
-- 4. LOTES (product_batches)
-- IDs auto-asignados: 1..80
-- =============================================================
INSERT INTO product_batches (
  product_id, lot_number, manufacture_date, expiration_date,
  quantity, cost, supplier_id, status
) VALUES
  -- Paracetamol 500mg (1,2)
  (1,  'LOT-PAR-2025-001', '2025-01-15', '2027-01-15',  50, 2200, 2, 'activo'),
  (1,  'LOT-PAR-2025-002', '2025-06-10', '2027-06-10',  30, 2400, 1, 'activo'),
  -- Ibuprofeno 400mg (3,4)
  (2,  'LOT-IBU-2025-001', '2025-02-20', '2027-02-20',  40, 3500, 2, 'activo'),
  (2,  'LOT-IBU-2025-002', '2025-08-05', '2027-08-05',  25, 3800, 4, 'activo'),
  -- Amoxicilina 500mg (5)
  (3,  'LOT-AMX-2025-001', '2025-03-10', '2026-09-10',  20, 5500, 3, 'activo'),
  -- Omeprazol 20mg (6,7)
  (4,  'LOT-OME-2025-001', '2025-01-05', '2027-01-05',  35, 7800, 2, 'activo'),
  (4,  'LOT-OME-2025-002', '2025-07-20', '2027-07-20',  20, 8200, 5, 'activo'),
  -- Losartan 50mg (8)
  (5,  'LOT-LOS-2025-001', '2025-04-01', '2027-04-01',  15, 10000, 6, 'activo'),
  -- Metformina 850mg (9,10)
  (6,  'LOT-MET-2025-001', '2025-02-15', '2027-02-15',  25, 6500, 7, 'activo'),
  (6,  'LOT-MET-2025-002', '2025-09-01', '2027-09-01',  18, 6800, 2, 'activo'),
  -- Azitromicina 500mg (11)
  (7,  'LOT-AZI-2025-001', '2025-05-10', '2027-05-10',  12, 12000, 3, 'activo'),
  -- Diclofenaco 100mg (12,13)
  (8,  'LOT-DIC-2025-001', '2025-01-25', '2027-01-25',  30, 4200, 4, 'activo'),
  (8,  'LOT-DIC-2025-002', '2025-07-15', '2027-07-15',  22, 4500, 1, 'activo'),
  -- Clonazepam 2mg (14)
  (9,  'LOT-CLO-2025-001', '2025-03-20', '2027-03-20',  10, 15000, 6, 'activo'),
  -- Salbutamol Inhalador (15)
  (10, 'LOT-SAL-2025-001', '2025-06-01', '2027-06-01',   8, 24000, 3, 'activo'),
  -- Dexametasona 4mg (16)
  (11, 'LOT-DEX-2025-001', '2025-04-15', '2027-04-15',  14, 5000, 7, 'activo'),
  -- Ranitidina 150mg (17)
  (12, 'LOT-RAN-2025-001', '2025-02-28', '2026-08-28',  18, 3200, 4, 'activo'),
  -- Naproxeno 250mg (18)
  (13, 'LOT-NAP-2025-001', '2025-05-20', '2027-05-20',  16, 5200, 2, 'activo'),
  -- Ciprofloxacino 500mg (19)
  (14, 'LOT-CIP-2025-001', '2025-03-05', '2027-03-05',  10, 7500, 5, 'activo'),
  -- Prednisona 20mg (20)
  (15, 'LOT-PRE-2025-001', '2025-01-10', '2027-01-10',  20, 2800, 1, 'activo'),
  -- Cetirizina 10mg (21)
  (16, 'LOT-CET-2025-001', '2025-04-05', '2027-04-05',  25, 3600, 9, 'activo'),
  -- Loratadina 10mg (22)
  (17, 'LOT-LOR-2025-001', '2025-03-12', '2027-03-12',  22, 4000, 8, 'activo'),
  -- Pantoprazol 40mg (23)
  (18, 'LOT-PAN-2025-001', '2025-05-01', '2027-05-01',  14, 9800, 10, 'activo'),
  -- Fluoxetina 20mg (24)
  (19, 'LOT-FLU-2025-001', '2025-06-15', '2027-06-15',  12, 10500, 7, 'activo'),
  -- Atorvastatina 20mg (25)
  (20, 'LOT-ATV-2025-001', '2025-02-10', '2027-02-10',  10, 12500, 3, 'activo'),
  -- Amlodipino 5mg (26)
  (21, 'LOT-AML-2025-001', '2025-07-01', '2027-07-01',  16, 5600, 9, 'activo'),
  -- Metoprolol 50mg (27)
  (22, 'LOT-MTP-2025-001', '2025-04-20', '2027-04-20',  14, 5200, 6, 'activo'),
  -- Enalapril 10mg (28)
  (23, 'LOT-ENA-2025-001', '2025-05-15', '2027-05-15',  18, 3800, 8, 'activo'),
  -- Captopril 25mg (29)
  (24, 'LOT-CAP-2025-001', '2025-01-20', '2027-01-20',  20, 2200, 11, 'activo'),
  -- Hidroclorotiazida 25mg (30)
  (25, 'LOT-HCT-2025-001', '2025-06-25', '2027-06-25',  22, 2600, 4, 'activo'),
  -- Warfarina 5mg (31)
  (26, 'LOT-WAR-2025-001', '2025-03-01', '2027-03-01',   8, 4500, 2, 'activo'),
  -- Insulina NPH (32)
  (27, 'LOT-INS-2025-001', '2025-04-10', '2026-10-10',   6, 30000, 6, 'activo'),
  -- Metformina 500mg (33)
  (28, 'LOT-MF5-2025-001', '2025-07-10', '2027-07-10',  28, 3500, 7, 'activo'),
  -- Glibenclamida 5mg (34)
  (29, 'LOT-GLI-2025-001', '2025-02-25', '2027-02-25',  20, 2400, 1, 'activo'),
  -- Levotiroxina 50mcg (35)
  (30, 'LOT-LEV-2025-001', '2025-05-05', '2027-05-05',  12, 8000, 10, 'activo'),
  -- Acetaminofen Jarabe (36)
  (31, 'LOT-ACJ-2025-001', '2025-06-20', '2027-06-20',  15, 3000, 11, 'activo'),
  -- Ibuprofeno Jarabe (37)
  (32, 'LOT-IBJ-2025-001', '2025-03-15', '2027-03-15',  12, 3800, 4, 'activo'),
  -- Amoxicilina Suspension (38)
  (33, 'LOT-AMS-2025-001', '2025-04-25', '2026-10-25',  10, 6200, 9, 'activo'),
  -- Ceftriaxona 1g (39)
  (34, 'LOT-CEF-2025-001', '2025-01-30', '2027-01-30',   8, 18500, 6, 'activo'),
  -- Diclofenaco Gel (40)
  (35, 'LOT-DCG-2025-001', '2025-07-05', '2028-07-05',  20, 5800, 12, 'activo'),
  -- Miconazol Crema (41)
  (36, 'LOT-MIC-2025-001', '2025-05-10', '2027-05-10',  14, 4800, 8, 'activo'),
  -- Permetrina Crema (42)
  (37, 'LOT-PER-2025-001', '2025-02-05', '2027-02-05',  10, 7200, 3, 'activo'),
  -- Neomicina Gotas (43)
  (38, 'LOT-NEO-2025-001', '2025-06-08', '2026-12-08',  12, 4500, 5, 'activo'),
  -- Timolol Gotas (44)
  (39, 'LOT-TIM-2025-001', '2025-03-18', '2027-03-18',   8, 10500, 10, 'activo'),
  -- Metronidazol 500mg (45)
  (40, 'LOT-METR-2025-001', '2025-04-12', '2027-04-12',  18, 3800, 12, 'activo'),
  -- Tramadol 50mg (46)
  (41, 'LOT-TRA-2025-001', '2025-01-18', '2027-01-18',   8, 8500, 7, 'activo'),
  -- Morfina 10mg (47)
  (42, 'LOT-MOR-2025-001', '2025-05-25', '2027-05-25',   4, 24000, 6, 'activo'),
  -- Diazepam 10mg (48)
  (43, 'LOT-DIA-2025-001', '2025-06-30', '2027-06-30',  10, 5800, 11, 'activo'),
  -- Sildenafil 50mg (49)
  (44, 'LOT-SIL-2025-001', '2025-02-12', '2027-02-12',   6, 19000, 3, 'activo'),
  -- Ondansetron 4mg (50)
  (45, 'LOT-OND-2025-001', '2025-07-20', '2027-07-20',  10, 6500, 5, 'activo'),
  -- Seroquel 100mg (51)
  (46, 'LOT-SER-2025-001', '2025-03-08', '2027-03-08',   5, 28000, 2, 'activo'),
  -- Risperidona 2mg (52)
  (47, 'LOT-RIS-2025-001', '2025-04-18', '2027-04-18',   8, 12000, 9, 'activo'),
  -- Carbamazepina 200mg (53)
  (48, 'LOT-CAR-2025-001', '2025-05-28', '2027-05-28',  10, 5800, 4, 'activo'),
  -- Fenitoina 100mg (54)
  (49, 'LOT-FEN-2025-001', '2025-01-22', '2027-01-22',  12, 3500, 8, 'activo'),
  -- Valproato 500mg (55)
  (50, 'LOT-VAL-2025-001', '2025-06-05', '2027-06-05',   8, 8000, 10, 'activo'),

  -- DISPOSITIVOS MEDICOS
  -- Jeringa 5ml (56)
  (51, 'LOT-JR5-2025-001', '2025-06-01', '2030-06-01', 200,  450, 8, 'activo'),
  -- Jeringa 10ml (57)
  (52, 'LOT-JR10-2025-001', '2025-07-01', '2030-07-01', 150,  700, 8, 'activo'),
  -- Guantes M (58)
  (53, 'LOT-GUM-2025-001', '2025-07-15', '2030-07-15', 100, 12000, 10, 'activo'),
  -- Guantes L (59)
  (54, 'LOT-GUL-2025-001', '2025-08-01', '2030-08-01', 100, 12000, 10, 'activo'),
  -- Termometro (60)
  (55, 'LOT-TER-2025-001', '2025-04-01', '2035-04-01',  10, 18000, 8, 'activo'),
  -- Tensiotometro (61)
  (56, 'LOT-TEN-2025-001', '2025-05-01', '2035-05-01',   5, 60000, 8, 'activo'),
  -- Mascarilla (62)
  (57, 'LOT-MAS-2025-001', '2025-08-10', '2028-08-10', 150, 7000, 11, 'activo'),
  -- Alcohol Gel (63)
  (58, 'LOT-ALC-2025-001', '2025-09-01', '2027-09-01',  80, 5500, 12, 'activo'),
  -- Gasas (64)
  (59, 'LOT-GAS-2025-001', '2025-06-10', '2030-06-10', 120, 2200, 11, 'activo'),
  -- Estetoscopio (65)
  (60, 'LOT-EST-2025-001', '2025-03-01', '2035-03-01',   3, 80000, 10, 'activo'),
  -- Oximetro (66)
  (61, 'LOT-OXI-2025-001', '2025-04-15', '2035-04-15',   5, 38000, 8, 'activo'),
  -- Nebulizador (67)
  (62, 'LOT-NEB-2025-001', '2025-07-20', '2035-07-20',   3, 65000, 6, 'activo'),

  -- COSMETICOS
  -- Protector Solar (68)
  (63, 'LOT-PSF-2025-001', '2025-03-15', '2027-03-15',  12, 18000, 3, 'activo'),
  -- Shampoo (69)
  (64, 'LOT-SHA-2025-001', '2025-06-20', '2028-06-20',  25, 12000, 5, 'activo'),
  -- Crema Facial (70)
  (65, 'LOT-CRF-2025-001', '2025-05-10', '2027-05-10',   8, 22000, 7, 'activo'),
  -- Bloqueador FPS70 (71)
  (66, 'LOT-BFS-2025-001', '2025-04-01', '2027-04-01',   6, 26000, 3, 'activo'),
  -- Crema Antiacne (72)
  (67, 'LOT-ANT-2025-001', '2025-07-25', '2027-07-25',  10, 14500, 9, 'activo'),

  -- ALIMENTOS
  -- Vitamina C (73)
  (68, 'LOT-VTC-2025-001', '2025-04-10', '2027-04-10',  30, 14000, 7, 'activo'),
  -- Suplemento (74)
  (69, 'LOT-SUP-2025-001', '2025-02-01', '2027-02-01',  18, 24000, 6, 'activo'),
  -- Vitamina D3 (75)
  (70, 'LOT-VD3-2025-001', '2025-05-15', '2027-05-15',  15, 19000, 11, 'activo'),
  -- Omega 3 (76)
  (71, 'LOT-OMG-2025-001', '2025-06-25', '2027-06-25',  12, 22000, 12, 'activo'),
  -- Probioticos (77)
  (72, 'LOT-PRO-2025-001', '2025-03-20', '2027-03-20',  10, 26000, 5, 'activo'),

  -- LOTES VENCIDOS (78,79)
  (1,  'LOT-PAR-2023-OLD', '2023-01-10', '2025-01-10',   5, 1800, 2, 'vencido'),
  (2,  'LOT-IBU-2023-OLD', '2023-03-15', '2025-03-15',   3, 3000, 4, 'vencido'),

  -- LOTE EN CUARENTENA (80)
  (3,  'LOT-AMX-2024-QA',  '2024-06-01', '2026-06-01',   8, 5000, 3, 'cuarentena');

-- =============================================================
-- 5. COMPRAS (purchases) — 15 compras
-- =============================================================
INSERT INTO purchases (supplier_id, purchase_date, total_cost) VALUES
  (2,  '2025-01-10T09:30:00.000Z', 165000),
  (3,  '2025-01-20T10:00:00.000Z', 210000),
  (1,  '2025-02-05T11:15:00.000Z', 125000),
  (4,  '2025-02-18T08:45:00.000Z', 180000),
  (5,  '2025-03-02T14:00:00.000Z', 95000),
  (6,  '2025-03-15T09:00:00.000Z', 150000),
  (7,  '2025-04-01T10:30:00.000Z', 110000),
  (8,  '2025-04-15T11:00:00.000Z', 275000),
  (9,  '2025-05-01T08:30:00.000Z', 135000),
  (10, '2025-05-15T10:00:00.000Z', 195000),
  (11, '2025-06-01T09:15:00.000Z', 85000),
  (12, '2025-06-15T14:30:00.000Z', 160000),
  (2,  '2025-07-01T08:00:00.000Z', 220000),
  (3,  '2025-07-15T10:45:00.000Z', 175000),
  (8,  '2025-08-01T11:30:00.000Z', 310000);

-- =============================================================
-- 6. DETALLES DE COMPRA (purchase_items) — 50 items
-- =============================================================
INSERT INTO purchase_items (
  purchase_id, product_id, batch_id, quantity, cost,
  lot_number, manufacture_date, expiration_date
) VALUES
  -- Compra 1 (supplier 2): Paracetamol + Ibuprofeno
  (1, 1,  1,  50, 2200, 'LOT-PAR-2025-001', '2025-01-15', '2027-01-15'),
  (1, 2,  3,  40, 3500, 'LOT-IBU-2025-001', '2025-02-20', '2027-02-20'),
  -- Compra 2 (supplier 3): Omeprazol + Amoxicilina + Atorvastatina
  (2, 4,  6,  35, 7800, 'LOT-OME-2025-001', '2025-01-05', '2027-01-05'),
  (2, 3,  5,  20, 5500, 'LOT-AMX-2025-001', '2025-03-10', '2026-09-10'),
  (2, 20, 25, 10, 12500, 'LOT-ATV-2025-001', '2025-02-10', '2027-02-10'),
  -- Compra 3 (supplier 1): Paracetamol lote 2 + Prednisona + Captopril
  (3, 1,  2,  30, 2400, 'LOT-PAR-2025-002', '2025-06-10', '2027-06-10'),
  (3, 15, 20, 20, 2800, 'LOT-PRE-2025-001', '2025-01-10', '2027-01-10'),
  (3, 24, 29, 20, 2200, 'LOT-CAP-2025-001', '2025-01-20', '2027-01-20'),
  -- Compra 4 (supplier 4): Diclofenaco + Ranitidina + Loratadina
  (4, 8,  12, 30, 4200, 'LOT-DIC-2025-001', '2025-01-25', '2027-01-25'),
  (4, 12, 17, 18, 3200, 'LOT-RAN-2025-001', '2025-02-28', '2026-08-28'),
  (4, 17, 22, 22, 4000, 'LOT-LOR-2025-001', '2025-03-12', '2027-03-12'),
  -- Compra 5 (supplier 5): Omeprazol lote 2 + Ciprofloxacino + Ondansetron
  (5, 4,  7,  20, 8200, 'LOT-OME-2025-002', '2025-07-20', '2027-07-20'),
  (5, 14, 19, 10, 7500, 'LOT-CIP-2025-001', '2025-03-05', '2027-03-05'),
  (5, 45, 50, 10, 6500, 'LOT-OND-2025-001', '2025-07-20', '2027-07-20'),
  -- Compra 6 (supplier 6): Losartan + Clonazepam + Insulina + Morfina
  (6, 5,  8,  15, 10000, 'LOT-LOS-2025-001', '2025-04-01', '2027-04-01'),
  (6, 9,  14, 10, 15000, 'LOT-CLO-2025-001', '2025-03-20', '2027-03-20'),
  (6, 27, 32,  6, 30000, 'LOT-INS-2025-001', '2025-04-10', '2026-10-10'),
  (6, 42, 47,  4, 24000, 'LOT-MOR-2025-001', '2025-05-25', '2027-05-25'),
  -- Compra 7 (supplier 7): Metformina + Dexametasona + Fluoxetina
  (7, 6,  9,  25, 6500, 'LOT-MET-2025-001', '2025-02-15', '2027-02-15'),
  (7, 11, 16, 14, 5000, 'LOT-DEX-2025-001', '2025-04-15', '2027-04-15'),
  (7, 19, 24, 12, 10500, 'LOT-FLU-2025-001', '2025-06-15', '2027-06-15'),
  -- Compra 8 (supplier 8): Dispositivos medicos
  (8, 51, 56, 200,  450, 'LOT-JR5-2025-001', '2025-06-01', '2030-06-01'),
  (8, 52, 57, 150,  700, 'LOT-JR10-2025-001', '2025-07-01', '2030-07-01'),
  (8, 55, 60,  10, 18000, 'LOT-TER-2025-001', '2025-04-01', '2035-04-01'),
  (8, 56, 61,   5, 60000, 'LOT-TEN-2025-001', '2025-05-01', '2035-05-01'),
  (8, 62, 67,   3, 65000, 'LOT-NEB-2025-001', '2025-07-20', '2035-07-20'),
  -- Compra 9 (supplier 9): Cetirizina + Amlodipino + Risperidona + Neomicina
  (9, 16, 21, 25, 3600, 'LOT-CET-2025-001', '2025-04-05', '2027-04-05'),
  (9, 21, 26, 16, 5600, 'LOT-AML-2025-001', '2025-07-01', '2027-07-01'),
  (9, 47, 52,  8, 12000, 'LOT-RIS-2025-001', '2025-04-18', '2027-04-18'),
  (9, 38, 43, 12, 4500, 'LOT-NEO-2025-001', '2025-06-08', '2026-12-08'),
  -- Compra 10 (supplier 10): Guantes + Estetoscopio + Oximetro + Gasas
  (10, 53, 58, 100, 12000, 'LOT-GUM-2025-001', '2025-07-15', '2030-07-15'),
  (10, 54, 59, 100, 12000, 'LOT-GUL-2025-001', '2025-08-01', '2030-08-01'),
  (10, 60, 65,   3, 80000, 'LOT-EST-2025-001', '2025-03-01', '2035-03-01'),
  (10, 61, 66,   5, 38000, 'LOT-OXI-2025-001', '2025-04-15', '2035-04-15'),
  (10, 59, 64, 120,  2200, 'LOT-GAS-2025-001', '2025-06-10', '2030-06-10'),
  -- Compra 11 (supplier 11): Metformina 500 + Acetaminofen jarabe + Diazepam
  (11, 28, 33, 28, 3500, 'LOT-MF5-2025-001', '2025-07-10', '2027-07-10'),
  (11, 31, 36, 15, 3000, 'LOT-ACJ-2025-001', '2025-06-20', '2027-06-20'),
  (11, 43, 48, 10, 5800, 'LOT-DIA-2025-001', '2025-06-30', '2027-06-30'),
  -- Compra 12 (supplier 12): Ibuprofeno jarabe + HCT + Metronidazol + Cosmeticos
  (12, 32, 37, 12, 3800, 'LOT-IBJ-2025-001', '2025-03-15', '2027-03-15'),
  (12, 25, 30, 22, 2600, 'LOT-HCT-2025-001', '2025-06-25', '2027-06-25'),
  (12, 40, 45, 18, 3800, 'LOT-METR-2025-001', '2025-04-12', '2027-04-12'),
  (12, 67, 72, 10, 14500, 'LOT-ANT-2025-001', '2025-07-25', '2027-07-25'),
  -- Compra 13 (supplier 2): Naproxeno + Azitromicina + Levotiroxina + Metoprolol
  (13, 13, 18, 16, 5200, 'LOT-NAP-2025-001', '2025-05-20', '2027-05-20'),
  (13, 7,  11, 12, 12000, 'LOT-AZI-2025-001', '2025-05-10', '2027-05-10'),
  (13, 30, 35, 12, 8000, 'LOT-LEV-2025-001', '2025-05-05', '2027-05-05'),
  (13, 22, 27, 14, 5200, 'LOT-MTP-2025-001', '2025-04-20', '2027-04-20'),
  -- Compra 14 (supplier 3): Enalapril + Glibenclamida + Fenitoina + Valproato + Carbamazepina
  (14, 23, 28, 18, 3800, 'LOT-ENA-2025-001', '2025-05-15', '2027-05-15'),
  (14, 29, 34, 20, 2400, 'LOT-GLI-2025-001', '2025-02-25', '2027-02-25'),
  (14, 49, 54, 12, 3500, 'LOT-FEN-2025-001', '2025-01-22', '2027-01-22'),
  (14, 50, 55,  8, 8000, 'LOT-VAL-2025-001', '2025-06-05', '2027-06-05'),
  (14, 48, 53, 10, 5800, 'LOT-CAR-2025-001', '2025-05-28', '2027-05-28'),
  -- Compra 15 (supplier 8): Suplementos + Cosmeticos + Mascarilla + Alcohol + Seroquel
  (15, 68, 73, 30, 14000, 'LOT-VTC-2025-001', '2025-04-10', '2027-04-10'),
  (15, 69, 74, 18, 24000, 'LOT-SUP-2025-001', '2025-02-01', '2027-02-01'),
  (15, 70, 75, 15, 19000, 'LOT-VD3-2025-001', '2025-05-15', '2027-05-15'),
  (15, 71, 76, 12, 22000, 'LOT-OMG-2025-001', '2025-06-25', '2027-06-25'),
  (15, 57, 62, 150, 7000, 'LOT-MAS-2025-001', '2025-08-10', '2028-08-10'),
  (15, 58, 63,  80, 5500, 'LOT-ALC-2025-001', '2025-09-01', '2027-09-01'),
  (15, 46, 51,   5, 28000, 'LOT-SER-2025-001', '2025-03-08', '2027-03-08'),
  (15, 41, 46,   8, 8500, 'LOT-TRA-2025-001', '2025-01-18', '2027-01-18'),
  (15, 39, 44,   8, 10500, 'LOT-TIM-2025-001', '2025-03-18', '2027-03-18'),
  (15, 33, 38,  10, 6200, 'LOT-AMS-2025-001', '2025-04-25', '2026-10-25'),
  (15, 34, 39,   8, 18500, 'LOT-CEF-2025-001', '2025-01-30', '2027-01-30'),
  (15, 36, 41,  14, 4800, 'LOT-MIC-2025-001', '2025-05-10', '2027-05-10'),
  (15, 37, 42,  10, 7200, 'LOT-PER-2025-001', '2025-02-05', '2027-02-05'),
  (15, 44, 49,   6, 19000, 'LOT-SIL-2025-001', '2025-02-12', '2027-02-12'),
  (15, 26, 31,   8, 4500, 'LOT-WAR-2025-001', '2025-03-01', '2027-03-01'),
  (15, 63, 68,  12, 18000, 'LOT-PSF-2025-001', '2025-03-15', '2027-03-15'),
  (15, 64, 69,  25, 12000, 'LOT-SHA-2025-001', '2025-06-20', '2028-06-20'),
  (15, 65, 70,   8, 22000, 'LOT-CRF-2025-001', '2025-05-10', '2027-05-10'),
  (15, 66, 71,   6, 26000, 'LOT-BFS-2025-001', '2025-04-01', '2027-04-01'),
  (15, 72, 77,  10, 26000, 'LOT-PRO-2025-001', '2025-03-20', '2027-03-20');

-- =============================================================
-- 7. VENTAS (sales) — 25 ventas enero-agosto 2025
-- =============================================================
INSERT INTO sales (user_id, sale_date, total, profit) VALUES
  (2, '2025-01-05T10:30:00.000Z',  14000,  5200),
  (3, '2025-01-12T14:15:00.000Z',  27500,  9800),
  (4, '2025-01-20T09:00:00.000Z',  42000, 15000),
  (2, '2025-01-28T16:45:00.000Z',  18300,  6500),
  (5, '2025-02-03T11:00:00.000Z',  35200, 12000),
  (3, '2025-02-10T13:30:00.000Z',  56000, 18500),
  (2, '2025-02-18T08:00:00.000Z',  22400,  7800),
  (4, '2025-02-25T15:20:00.000Z',  63500, 22000),
  (6, '2025-03-02T10:10:00.000Z',  12800,  4600),
  (3, '2025-03-10T12:00:00.000Z',  38500, 13000),
  (2, '2025-03-18T09:30:00.000Z',  29600, 10200),
  (7, '2025-03-25T14:00:00.000Z',  48000, 16500),
  (4, '2025-04-01T08:45:00.000Z',  15600,  5800),
  (2, '2025-04-08T11:15:00.000Z',  72000, 24000),
  (3, '2025-04-15T16:00:00.000Z',  33400, 11500),
  (5, '2025-04-22T10:00:00.000Z',  19800,  7200),
  (2, '2025-05-01T09:00:00.000Z',  45000, 15500),
  (4, '2025-05-08T14:30:00.000Z',  26700,  9000),
  (3, '2025-05-15T11:00:00.000Z',  54000, 18000),
  (7, '2025-05-22T08:30:00.000Z',  11200,  4000),
  (2, '2025-06-01T10:00:00.000Z',  67000, 23000),
  (3, '2025-06-10T13:00:00.000Z',  31500, 10800),
  (4, '2025-06-20T15:30:00.000Z',  41000, 14000),
  (2, '2025-07-01T08:00:00.000Z',  24400,  8800),
  (3, '2025-07-10T12:00:00.000Z',  58000, 20000),
  (4, '2025-07-15T10:30:00.000Z',  17200,  6200),
  (2, '2025-07-22T14:00:00.000Z',  36500, 12500),
  (5, '2025-07-28T09:15:00.000Z',  82000, 28000),
  (3, '2025-08-01T11:00:00.000Z',  21000,  7500),
  (7, '2025-08-08T16:00:00.000Z',  44000, 15000),
  (2, '2025-08-15T08:30:00.000Z',  29000, 10000),
  (4, '2025-08-20T13:00:00.000Z',  62000, 21000);

-- =============================================================
-- 8. DETALLES DE VENTA (sale_items) — 80 items
-- =============================================================
INSERT INTO sale_items (sale_id, product_id, batch_id, quantity, unit_price, subtotal) VALUES
  -- Venta 1: Paracetamol x4
  (1, 1,  1,   4, 3500, 14000),
  -- Venta 2: Ibuprofeno x3 + Cetirizina x2
  (2, 2,  3,   3, 5200, 15600),
  (2, 16, 21,  2, 5500, 11000),
  -- Venta 3: Omeprazol x2 + Losartan x1 + Amlodipino x1
  (3, 4,  6,   2, 12000, 24000),
  (3, 5,  8,   1, 15000, 15000),
  (3, 21, 26,  1, 8500,  8500),
  -- Venta 4: Ranitidina x2 + Paracetamol x1
  (4, 12, 17,  2, 4800,   9600),
  (4, 1,  1,   1, 3500,   3500),
  -- Venta 5: Amoxicilina x1 + Salbutamol x1 + Guantes x1
  (5, 3,  5,   1, 8500,   8500),
  (5, 10, 15,  1, 35000, 35000),
  -- Venta 6: Clonazepam x1 + Dexametasona x2 + Insulina x1
  (6, 9,  14,  1, 22000, 22000),
  (6, 11, 16,  2, 7200,  14400),
  (6, 27, 32,  1, 45000, 45000),
  -- Venta 7: Diclofenaco x2 + Metformina x1
  (7, 8,  12,  2, 6500,  13000),
  (7, 6,  9,   1, 9800,   9800),
  -- Venta 8: Azitromicina x1 + Atorvastatina x1 + Jeringa x10
  (8, 7,  11,  1, 18000, 18000),
  (8, 20, 25,  1, 19000, 19000),
  (8, 51, 56, 10, 800,    8000),
  -- Venta 9: Loratadina x2
  (9, 17, 22,  2, 6200,  12400),
  -- Venta 10: Naproxeno x1 + Fluoxetina x1 + Mascarilla x1
  (10, 13, 18, 1, 7500,   7500),
  (10, 19, 24, 1, 16000, 16000),
  (10, 57, 62, 1, 12000, 12000),
  -- Venta 11: Ciprofloxacino x1 + Enalapril x2
  (11, 14, 19, 1, 11000, 11000),
  (11, 23, 28, 2, 5600,  11200),
  -- Venta 12: Pantoprazol x1 + Metoprolol x2 + Gasas x5
  (12, 18, 23, 1, 14500, 14500),
  (12, 22, 27, 2, 7800,  15600),
  (12, 59, 64, 5, 3500,  17500),
  -- Venta 13: Prednisona x2
  (13, 15, 20, 2, 4200,   8400),
  -- Venta 14: Salbutamol x1 + Tramadol x1 + Morfina x1 + Termometro x1
  (14, 10, 15, 1, 35000, 35000),
  (14, 41, 46, 1, 12500, 12500),
  (14, 42, 47, 1, 35000, 35000),
  (14, 55, 60, 1, 25000, 25000),
  -- Venta 15: Captopril x2 + Hidroclorotiazida x1
  (15, 24, 29, 2, 3200,   6400),
  (15, 25, 30, 1, 3800,   3800),
  -- Venta 16: Ibuprofeno Jarabe x1 + Acetaminofen Jarabe x1
  (16, 32, 37, 1, 5800,   5800),
  (16, 31, 36, 1, 4500,   4500),
  -- Venta 17: Oximetro x1 + Estetoscopio x1 + Protector Solar x1
  (17, 61, 66, 1, 55000, 55000),
  (17, 60, 65, 1, 120000, 120000),
  (17, 63, 68, 1, 28000, 28000),
  -- Venta 18: Neomicina x1 + Metronidazol x2 + Alcohol Gel x2
  (18, 38, 43, 1, 6800,   6800),
  (18, 40, 45, 2, 5800,  11600),
  (18, 58, 63, 2, 8500,  17000),
  -- Venta 19: Levotiroxina x1 + Nebulizador x1
  (19, 30, 35, 1, 12000, 12000),
  (19, 62, 67, 1, 95000, 95000),
  -- Venta 20: Vitamina C x3 + Probioticos x1
  (20, 68, 73, 3, 22000, 66000),
  (20, 72, 77, 1, 38000, 38000),
  -- Venta 21: Diazepam x1 + Fenitoina x1 + Valproato x1 + Carbamazepina x1
  (21, 43, 48, 1, 8500,   8500),
  (21, 49, 54, 1, 5200,   5200),
  (21, 50, 55, 1, 12000, 12000),
  (21, 48, 53, 1, 8500,   8500),
  -- Venta 22: Guantes L x1 + Mascarilla x2 + Ondansetron x1
  (22, 54, 59, 1, 18000, 18000),
  (22, 57, 62, 2, 12000, 24000),
  (22, 45, 50, 1, 9500,   9500),
  -- Venta 23: Glibenclamida x2 + Warfarina x1
  (23, 29, 34, 2, 3500,   7000),
  (23, 26, 31, 1, 6500,   6500),
  -- Venta 24: Suplemento Vitaminico x1 + Omega 3 x1 + Vitamina D3 x1
  (24, 69, 74, 1, 35000, 35000),
  (24, 71, 76, 1, 32000, 32000),
  (24, 70, 75, 1, 28000, 28000),
  -- Venta 25: Timolol x1 + Miconazol x1 + Crema Facial x1
  (25, 39, 44, 1, 15500, 15500),
  (25, 36, 41, 1, 7200,   7200),
  (25, 65, 70, 1, 32000, 32000),
  -- Venta 26: Permetrina x1 + Diclofenaco Gel x1 + Bloqueador FPS70 x1
  (26, 37, 42, 1, 11000, 11000),
  (26, 35, 40, 1, 8800,   8800),
  (26, 66, 71, 1, 38000, 38000),
  -- Venta 27: Risperidona x1 + Seroquel x1
  (27, 47, 52, 1, 18000, 18000),
  (27, 46, 51, 1, 42000, 42000),
  -- Venta 28: Amoxicilina Susp x1 + Ceftriaxona x1
  (28, 33, 38, 1, 9200,   9200),
  (28, 34, 39, 1, 28000, 28000),
  -- Venta 29: Shampoo x2 + Crema Antiacne x1
  (29, 64, 69, 2, 18500, 37000),
  (29, 67, 72, 1, 22000, 22000),
  -- Venta 30: Metformina 500 x2 + Sildenafil x1
  (30, 28, 33, 2, 5200,  10400),
  (30, 44, 49, 1, 28000, 28000),
  -- Venta 31: Paracetamol x2 + Diclofenaco x1
  (31, 1,  1,   2, 3500,   7000),
  (31, 8,  12,  1, 6500,   6500),
  -- Venta 32: Omeprazol x1 + Atorvastatina x1 + Metformina 850 x1
  (32, 4,  6,   1, 12000, 12000),
  (32, 20, 25,  1, 19000, 19000),
  (32, 6,  9,   1, 9800,   9800),
  -- Venta 33: Ibuprofeno x2 + Ranitidina x2
  (33, 2,  3,   2, 5200,  10400),
  (33, 12, 17,  2, 4800,   9600),
  -- Venta 34: Losartan x1 + Amlodipino x1 + Enalapril x1
  (34, 5,  8,   1, 15000, 15000),
  (34, 21, 26,  1, 8500,   8500),
  (34, 23, 28,  1, 5600,   5600),
  -- Venta 35: Guantes M x1 + Alcohol Gel x1 + Jeringa x5
  (35, 53, 58, 1, 18000, 18000),
  (35, 58, 63, 1, 8500,   8500),
  (35, 51, 56, 5, 800,    4000),
  -- Venta 36: Clonazepam x1 + Diazepam x1 + Fluoxetina x1
  (36, 9,  14, 1, 22000, 22000),
  (36, 43, 48, 1, 8500,   8500),
  (36, 19, 24, 1, 16000, 16000),
  -- Venta 37: Cetirizina x3 + Loratadina x3
  (37, 16, 21, 3, 5500,  16500),
  (37, 17, 22, 3, 6200,  18600),
  -- Venta 38: Naproxeno x2 + Prednisona x1
  (38, 13, 18, 2, 7500,  15000),
  (38, 15, 20, 1, 4200,   4200),
  -- Venta 39: Ceftriaxona x1 + Azitromicina x1
  (39, 34, 39, 1, 28000, 28000),
  (39, 7,  11, 1, 18000, 18000),
  -- Venta 40: Tensiotometro x1 + Estetoscopio x1
  (40, 56, 61, 1, 85000, 85000),
  (40, 60, 65, 1, 120000, 120000),
  -- Venta 41: Metoprolol x2 + Captopril x2 + HCT x1
  (41, 22, 27, 2, 7800,  15600),
  (41, 24, 29, 2, 3200,   6400),
  (41, 25, 30, 1, 3800,   3800),
  -- Venta 42: Acetaminofen Jarabe x2 + Ibuprofeno Jarabe x2
  (42, 31, 36, 2, 4500,   9000),
  (42, 32, 37, 2, 5800,  11600),
  -- Venta 43: Vitamina C x2 + Omega 3 x2 + Vitamina D3 x1
  (43, 68, 73, 2, 22000, 44000),
  (43, 71, 76, 2, 32000, 64000),
  (43, 70, 75, 1, 28000, 28000),
  -- Venta 44: Sildenafil x1 + Insulina x1
  (44, 44, 49, 1, 28000, 28000),
  (44, 27, 32, 1, 45000, 45000),
  -- Venta 45: Warfarina x1 + Glibenclamida x2 + Fenitoina x1
  (45, 26, 31, 1, 6500,   6500),
  (45, 29, 34, 2, 3500,   7000),
  (45, 49, 54, 1, 5200,   5200),
  -- Venta 46: Timolol x1 + Neomicina x2
  (46, 39, 44, 1, 15500, 15500),
  (46, 38, 43, 2, 6800,  13600),
  -- Venta 47: Miconazol x1 + Crema Antiacne x1 + Prot Solar x1
  (47, 36, 41, 1, 7200,   7200),
  (47, 67, 72, 1, 22000, 22000),
  (47, 63, 68, 1, 28000, 28000),
  -- Venta 48: Levotiroxina x1 + Nebulizador x1 + Oximetro x1
  (48, 30, 35, 1, 12000, 12000),
  (48, 62, 67, 1, 95000, 95000),
  (48, 61, 66, 1, 55000, 55000),
  -- Venta 49: Suplemento x1 + Probioticos x2
  (49, 69, 74, 1, 35000, 35000),
  (49, 72, 77, 2, 38000, 76000),
  -- Venta 50: Tramadol x1 + Ondansetron x2 + Paracetamol x5
  (50, 41, 46, 1, 12500, 12500),
  (50, 45, 50, 2, 9500,  19000),
  (50, 1,  1,   5, 3500,  17500);

-- =============================================================
-- 9. MOVIMIENTOS DE STOCK (kardex) — 100+ movimientos
-- =============================================================
INSERT INTO stock_movements (
  batch_id, movement_type, quantity, movement_date, user_id, reason,
  reference_type, reference_id
) VALUES
  -- === ENTRADAS POR COMPRA (30) ===
  (1,  'entrada_compra',  50, '2025-01-10T09:30:00.000Z', 1, 'Compra #1 - Dist. Farmaceutica Nacional', 'purchase', 1),
  (3,  'entrada_compra',  40, '2025-01-10T09:30:00.000Z', 1, 'Compra #1 - Dist. Farmaceutica Nacional', 'purchase', 1),
  (6,  'entrada_compra',  35, '2025-01-20T10:00:00.000Z', 1, 'Compra #2 - Cruz Verde', 'purchase', 2),
  (5,  'entrada_compra',  20, '2025-01-20T10:00:00.000Z', 1, 'Compra #2 - Cruz Verde', 'purchase', 2),
  (25, 'entrada_compra',  10, '2025-01-20T10:00:00.000Z', 1, 'Compra #2 - Cruz Verde', 'purchase', 2),
  (2,  'entrada_compra',  30, '2025-02-05T11:15:00.000Z', 1, 'Compra #3 - Drogas La Rebaja', 'purchase', 3),
  (20, 'entrada_compra',  20, '2025-02-05T11:15:00.000Z', 1, 'Compra #3 - Drogas La Rebaja', 'purchase', 3),
  (29, 'entrada_compra',  20, '2025-02-05T11:15:00.000Z', 1, 'Compra #3 - Drogas La Rebaja', 'purchase', 3),
  (12, 'entrada_compra',  30, '2025-02-18T08:45:00.000Z', 1, 'Compra #4 - Drogas La Rebaja', 'purchase', 4),
  (17, 'entrada_compra',  18, '2025-02-18T08:45:00.000Z', 1, 'Compra #4 - Drogas La Rebaja', 'purchase', 4),
  (22, 'entrada_compra',  22, '2025-02-18T08:45:00.000Z', 1, 'Compra #4 - Drogas La Rebaja', 'purchase', 4),
  (7,  'entrada_compra',  20, '2025-03-02T14:00:00.000Z', 1, 'Compra #5 - Distrifarma Plus', 'purchase', 5),
  (19, 'entrada_compra',  10, '2025-03-02T14:00:00.000Z', 1, 'Compra #5 - Distrifarma Plus', 'purchase', 5),
  (50, 'entrada_compra',  10, '2025-03-02T14:00:00.000Z', 1, 'Compra #5 - Distrifarma Plus', 'purchase', 5),
  (8,  'entrada_compra',  15, '2025-03-15T09:00:00.000Z', 1, 'Compra #6 - Medisanitas', 'purchase', 6),
  (14, 'entrada_compra',  10, '2025-03-15T09:00:00.000Z', 1, 'Compra #6 - Medisanitas', 'purchase', 6),
  (32, 'entrada_compra',   6, '2025-03-15T09:00:00.000Z', 1, 'Compra #6 - Medisanitas', 'purchase', 6),
  (47, 'entrada_compra',   4, '2025-03-15T09:00:00.000Z', 1, 'Compra #6 - Medisanitas', 'purchase', 6),
  (9,  'entrada_compra',  25, '2025-04-01T10:30:00.000Z', 1, 'Compra #7 - PharmaCol', 'purchase', 7),
  (16, 'entrada_compra',  14, '2025-04-01T10:30:00.000Z', 1, 'Compra #7 - PharmaCol', 'purchase', 7),
  (24, 'entrada_compra',  12, '2025-04-01T10:30:00.000Z', 1, 'Compra #7 - PharmaCol', 'purchase', 7),
  (56, 'entrada_compra', 200, '2025-04-15T11:00:00.000Z', 1, 'Compra #8 - Genfar Colombia', 'purchase', 8),
  (57, 'entrada_compra', 150, '2025-04-15T11:00:00.000Z', 1, 'Compra #8 - Genfar Colombia', 'purchase', 8),
  (60, 'entrada_compra',  10, '2025-04-15T11:00:00.000Z', 1, 'Compra #8 - Genfar Colombia', 'purchase', 8),
  (61, 'entrada_compra',   5, '2025-04-15T11:00:00.000Z', 1, 'Compra #8 - Genfar Colombia', 'purchase', 8),
  (67, 'entrada_compra',   3, '2025-04-15T11:00:00.000Z', 1, 'Compra #8 - Genfar Colombia', 'purchase', 8),
  (21, 'entrada_compra',  25, '2025-05-01T08:30:00.000Z', 1, 'Compra #9 - La Francia', 'purchase', 9),
  (26, 'entrada_compra',  16, '2025-05-01T08:30:00.000Z', 1, 'Compra #9 - La Francia', 'purchase', 9),
  (52, 'entrada_compra',   8, '2025-05-01T08:30:00.000Z', 1, 'Compra #9 - La Francia', 'purchase', 9),
  (43, 'entrada_compra',  12, '2025-05-01T08:30:00.000Z', 1, 'Compra #9 - La Francia', 'purchase', 9),
  (58, 'entrada_compra', 100, '2025-05-15T10:00:00.000Z', 1, 'Compra #10 - Dimed Norte', 'purchase', 10),
  (59, 'entrada_compra', 100, '2025-05-15T10:00:00.000Z', 1, 'Compra #10 - Dimed Norte', 'purchase', 10),
  (65, 'entrada_compra',   3, '2025-05-15T10:00:00.000Z', 1, 'Compra #10 - Dimed Norte', 'purchase', 10),
  (66, 'entrada_compra',   5, '2025-05-15T10:00:00.000Z', 1, 'Compra #10 - Dimed Norte', 'purchase', 10),
  (64, 'entrada_compra', 120, '2025-05-15T10:00:00.000Z', 1, 'Compra #10 - Dimed Norte', 'purchase', 10),
  (33, 'entrada_compra',  28, '2025-06-01T09:15:00.000Z', 1, 'Compra #11 - Farmatodo', 'purchase', 11),
  (36, 'entrada_compra',  15, '2025-06-01T09:15:00.000Z', 1, 'Compra #11 - Farmatodo', 'purchase', 11),
  (48, 'entrada_compra',  10, '2025-06-01T09:15:00.000Z', 1, 'Compra #11 - Farmatodo', 'purchase', 11),
  (37, 'entrada_compra',  12, '2025-06-15T14:30:00.000Z', 1, 'Compra #12 - Olimpica', 'purchase', 12),
  (30, 'entrada_compra',  22, '2025-06-15T14:30:00.000Z', 1, 'Compra #12 - Olimpica', 'purchase', 12),
  (45, 'entrada_compra',  18, '2025-06-15T14:30:00.000Z', 1, 'Compra #12 - Olimpica', 'purchase', 12),
  (72, 'entrada_compra',  10, '2025-06-15T14:30:00.000Z', 1, 'Compra #12 - Olimpica', 'purchase', 12),
  (18, 'entrada_compra',  16, '2025-07-01T08:00:00.000Z', 1, 'Compra #13 - Dist. Farmaceutica', 'purchase', 13),
  (11, 'entrada_compra',  12, '2025-07-01T08:00:00.000Z', 1, 'Compra #13 - Dist. Farmaceutica', 'purchase', 13),
  (35, 'entrada_compra',  12, '2025-07-01T08:00:00.000Z', 1, 'Compra #13 - Dist. Farmaceutica', 'purchase', 13),
  (27, 'entrada_compra',  14, '2025-07-01T08:00:00.000Z', 1, 'Compra #13 - Dist. Farmaceutica', 'purchase', 13),
  (28, 'entrada_compra',  18, '2025-07-15T10:45:00.000Z', 1, 'Compra #14 - Cruz Verde', 'purchase', 14),
  (34, 'entrada_compra',  20, '2025-07-15T10:45:00.000Z', 1, 'Compra #14 - Cruz Verde', 'purchase', 14),
  (54, 'entrada_compra',  12, '2025-07-15T10:45:00.000Z', 1, 'Compra #14 - Cruz Verde', 'purchase', 14),
  (55, 'entrada_compra',   8, '2025-07-15T10:45:00.000Z', 1, 'Compra #14 - Cruz Verde', 'purchase', 14),
  (53, 'entrada_compra',  10, '2025-07-15T10:45:00.000Z', 1, 'Compra #14 - Cruz Verde', 'purchase', 14),
  (73, 'entrada_compra',  30, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (74, 'entrada_compra',  18, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (75, 'entrada_compra',  15, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (76, 'entrada_compra',  12, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (62, 'entrada_compra', 150, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (63, 'entrada_compra',  80, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (51, 'entrada_compra',   5, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (46, 'entrada_compra',   8, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (44, 'entrada_compra',   8, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (38, 'entrada_compra',  10, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (39, 'entrada_compra',   8, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (41, 'entrada_compra',  14, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (42, 'entrada_compra',  10, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (49, 'entrada_compra',   6, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (31, 'entrada_compra',   8, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (68, 'entrada_compra',  12, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (69, 'entrada_compra',  25, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (70, 'entrada_compra',   8, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (71, 'entrada_compra',   6, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),
  (77, 'entrada_compra',  10, '2025-08-01T11:30:00.000Z', 1, 'Compra #15 - Genfar Colombia', 'purchase', 15),

  -- === SALIDAS POR VENTA (50) ===
  (1,  'salida_venta',    4, '2025-01-05T10:30:00.000Z', 2, 'Venta #1', 'sale', 1),
  (3,  'salida_venta',    3, '2025-01-12T14:15:00.000Z', 3, 'Venta #2', 'sale', 2),
  (21, 'salida_venta',    2, '2025-01-12T14:15:00.000Z', 3, 'Venta #2', 'sale', 2),
  (6,  'salida_venta',    2, '2025-01-20T09:00:00.000Z', 4, 'Venta #3', 'sale', 3),
  (8,  'salida_venta',    1, '2025-01-20T09:00:00.000Z', 4, 'Venta #3', 'sale', 3),
  (26, 'salida_venta',    1, '2025-01-20T09:00:00.000Z', 4, 'Venta #3', 'sale', 3),
  (17, 'salida_venta',    2, '2025-01-28T16:45:00.000Z', 2, 'Venta #4', 'sale', 4),
  (1,  'salida_venta',    1, '2025-01-28T16:45:00.000Z', 2, 'Venta #4', 'sale', 4),
  (5,  'salida_venta',    1, '2025-02-03T11:00:00.000Z', 5, 'Venta #5', 'sale', 5),
  (15, 'salida_venta',    1, '2025-02-03T11:00:00.000Z', 5, 'Venta #5', 'sale', 5),
  (14, 'salida_venta',    1, '2025-02-10T13:30:00.000Z', 3, 'Venta #6', 'sale', 6),
  (16, 'salida_venta',    2, '2025-02-10T13:30:00.000Z', 3, 'Venta #6', 'sale', 6),
  (32, 'salida_venta',    1, '2025-02-10T13:30:00.000Z', 3, 'Venta #6', 'sale', 6),
  (12, 'salida_venta',    2, '2025-02-18T08:00:00.000Z', 2, 'Venta #7', 'sale', 7),
  (9,  'salida_venta',    1, '2025-02-18T08:00:00.000Z', 2, 'Venta #7', 'sale', 7),
  (11, 'salida_venta',    1, '2025-02-25T15:20:00.000Z', 4, 'Venta #8', 'sale', 8),
  (25, 'salida_venta',    1, '2025-02-25T15:20:00.000Z', 4, 'Venta #8', 'sale', 8),
  (56, 'salida_venta',   10, '2025-02-25T15:20:00.000Z', 4, 'Venta #8', 'sale', 8),
  (22, 'salida_venta',    2, '2025-03-02T10:10:00.000Z', 6, 'Venta #9', 'sale', 9),
  (18, 'salida_venta',    1, '2025-03-10T12:00:00.000Z', 3, 'Venta #10', 'sale', 10),
  (24, 'salida_venta',    1, '2025-03-10T12:00:00.000Z', 3, 'Venta #10', 'sale', 10),
  (62, 'salida_venta',    1, '2025-03-10T12:00:00.000Z', 3, 'Venta #10', 'sale', 10),
  (19, 'salida_venta',    1, '2025-03-18T09:30:00.000Z', 2, 'Venta #11', 'sale', 11),
  (28, 'salida_venta',    2, '2025-03-18T09:30:00.000Z', 2, 'Venta #11', 'sale', 11),
  (23, 'salida_venta',    1, '2025-03-25T14:00:00.000Z', 7, 'Venta #12', 'sale', 12),
  (27, 'salida_venta',    2, '2025-03-25T14:00:00.000Z', 7, 'Venta #12', 'sale', 12),
  (64, 'salida_venta',    5, '2025-03-25T14:00:00.000Z', 7, 'Venta #12', 'sale', 12),
  (20, 'salida_venta',    2, '2025-04-01T08:45:00.000Z', 4, 'Venta #13', 'sale', 13),
  (15, 'salida_venta',    1, '2025-04-08T11:15:00.000Z', 2, 'Venta #14', 'sale', 14),
  (46, 'salida_venta',    1, '2025-04-08T11:15:00.000Z', 2, 'Venta #14', 'sale', 14),
  (47, 'salida_venta',    1, '2025-04-08T11:15:00.000Z', 2, 'Venta #14', 'sale', 14),
  (60, 'salida_venta',    1, '2025-04-08T11:15:00.000Z', 2, 'Venta #14', 'sale', 14),
  (29, 'salida_venta',    2, '2025-04-15T16:00:00.000Z', 3, 'Venta #15', 'sale', 15),
  (30, 'salida_venta',    1, '2025-04-15T16:00:00.000Z', 3, 'Venta #15', 'sale', 15),
  (37, 'salida_venta',    1, '2025-04-22T10:00:00.000Z', 5, 'Venta #16', 'sale', 16),
  (36, 'salida_venta',    1, '2025-04-22T10:00:00.000Z', 5, 'Venta #16', 'sale', 16),
  (66, 'salida_venta',    1, '2025-05-01T09:00:00.000Z', 2, 'Venta #17', 'sale', 17),
  (65, 'salida_venta',    1, '2025-05-01T09:00:00.000Z', 2, 'Venta #17', 'sale', 17),
  (68, 'salida_venta',    1, '2025-05-01T09:00:00.000Z', 2, 'Venta #17', 'sale', 17),
  (43, 'salida_venta',    1, '2025-05-08T14:30:00.000Z', 4, 'Venta #18', 'sale', 18),
  (45, 'salida_venta',    2, '2025-05-08T14:30:00.000Z', 4, 'Venta #18', 'sale', 18),
  (63, 'salida_venta',    2, '2025-05-08T14:30:00.000Z', 4, 'Venta #18', 'sale', 18),
  (35, 'salida_venta',    1, '2025-05-15T11:00:00.000Z', 3, 'Venta #19', 'sale', 19),
  (67, 'salida_venta',    1, '2025-05-15T11:00:00.000Z', 3, 'Venta #19', 'sale', 19),
  (73, 'salida_venta',    3, '2025-05-22T08:30:00.000Z', 7, 'Venta #20', 'sale', 20),
  (77, 'salida_venta',    1, '2025-05-22T08:30:00.000Z', 7, 'Venta #20', 'sale', 20),
  (48, 'salida_venta',    1, '2025-06-01T10:00:00.000Z', 2, 'Venta #21', 'sale', 21),
  (54, 'salida_venta',    1, '2025-06-01T10:00:00.000Z', 2, 'Venta #21', 'sale', 21),
  (55, 'salida_venta',    1, '2025-06-01T10:00:00.000Z', 2, 'Venta #21', 'sale', 21),
  (53, 'salida_venta',    1, '2025-06-01T10:00:00.000Z', 2, 'Venta #21', 'sale', 21),
  (59, 'salida_venta',    1, '2025-06-10T13:00:00.000Z', 3, 'Venta #22', 'sale', 22),
  (62, 'salida_venta',    2, '2025-06-10T13:00:00.000Z', 3, 'Venta #22', 'sale', 22),
  (50, 'salida_venta',    1, '2025-06-10T13:00:00.000Z', 3, 'Venta #22', 'sale', 22),
  (34, 'salida_venta',    2, '2025-06-20T15:30:00.000Z', 4, 'Venta #23', 'sale', 23),
  (31, 'salida_venta',    1, '2025-06-20T15:30:00.000Z', 4, 'Venta #23', 'sale', 23),
  (74, 'salida_venta',    1, '2025-07-01T08:00:00.000Z', 2, 'Venta #24', 'sale', 24),
  (76, 'salida_venta',    1, '2025-07-01T08:00:00.000Z', 2, 'Venta #24', 'sale', 24),
  (75, 'salida_venta',    1, '2025-07-01T08:00:00.000Z', 2, 'Venta #24', 'sale', 24),
  (44, 'salida_venta',    1, '2025-07-10T12:00:00.000Z', 3, 'Venta #25', 'sale', 25),
  (41, 'salida_venta',    1, '2025-07-10T12:00:00.000Z', 3, 'Venta #25', 'sale', 25),
  (70, 'salida_venta',    1, '2025-07-10T12:00:00.000Z', 3, 'Venta #25', 'sale', 25),
  (42, 'salida_venta',    1, '2025-07-15T10:30:00.000Z', 4, 'Venta #26', 'sale', 26),
  (40, 'salida_venta',    1, '2025-07-15T10:30:00.000Z', 4, 'Venta #26', 'sale', 26),
  (71, 'salida_venta',    1, '2025-07-15T10:30:00.000Z', 4, 'Venta #26', 'sale', 26),
  (52, 'salida_venta',    1, '2025-07-22T14:00:00.000Z', 2, 'Venta #27', 'sale', 27),
  (51, 'salida_venta',    1, '2025-07-22T14:00:00.000Z', 2, 'Venta #27', 'sale', 27),
  (38, 'salida_venta',    1, '2025-07-28T09:15:00.000Z', 5, 'Venta #28', 'sale', 28),
  (39, 'salida_venta',    1, '2025-07-28T09:15:00.000Z', 5, 'Venta #28', 'sale', 28),
  (69, 'salida_venta',    2, '2025-08-01T11:00:00.000Z', 3, 'Venta #29', 'sale', 29),
  (72, 'salida_venta',    1, '2025-08-01T11:00:00.000Z', 3, 'Venta #29', 'sale', 29),
  (33, 'salida_venta',    2, '2025-08-08T16:00:00.000Z', 7, 'Venta #30', 'sale', 30),
  (49, 'salida_venta',    1, '2025-08-08T16:00:00.000Z', 7, 'Venta #30', 'sale', 30),

  -- === AJUSTES DE STOCK (10) ===
  (1,  'ajuste_entrada',  5, '2025-02-01T08:00:00.000Z', 1, 'Ajuste inventario fisico Paracetamol', NULL, NULL),
  (12, 'ajuste_salida',   3, '2025-03-01T08:00:00.000Z', 1, 'Merma Diclofenaco por dano empaque', NULL, NULL),
  (3,  'ajuste_entrada',  2, '2025-04-01T08:00:00.000Z', 1, 'Ajuste inventario fisico Ibuprofeno', NULL, NULL),
  (6,  'ajuste_salida',   1, '2025-05-01T08:00:00.000Z', 1, 'Muestra clinica Omeprazol', NULL, NULL),
  (56, 'ajuste_salida',  10, '2025-06-01T08:00:00.000Z', 1, 'Merma Jeringa por dano', NULL, NULL),
  (58, 'ajuste_entrada',  5, '2025-07-01T08:00:00.000Z', 1, 'Ajuste inventario Guantes', NULL, NULL),
  (9,  'ajuste_salida',   2, '2025-07-15T08:00:00.000Z', 1, 'Muestra clinica Metformina', NULL, NULL),
  (63, 'ajuste_salida',   3, '2025-08-01T08:00:00.000Z', 1, 'Merma Alcohol Gel por dano', NULL, NULL),
  (21, 'ajuste_entrada',  3, '2025-08-05T08:00:00.000Z', 1, 'Ajuste inventario Cetirizina', NULL, NULL),
  (73, 'ajuste_salida',   2, '2025-08-10T08:00:00.000Z', 1, 'Muestra clinica Vitamina C', NULL, NULL),

  -- === BAJAS POR VENCIMIENTO (4) ===
  (78, 'baja',            5, '2025-07-01T09:00:00.000Z', 1, 'Baja Paracetamol vencido', NULL, NULL),
  (79, 'baja',            3, '2025-07-15T09:00:00.000Z', 1, 'Baja Ibuprofeno vencido', NULL, NULL),
  (12, 'baja',            2, '2025-08-01T09:00:00.000Z', 1, 'Baja Diclofenaco dano', NULL, NULL),
  (17, 'baja',            1, '2025-08-10T09:00:00.000Z', 1, 'Baja Ranitidina dano', NULL, NULL);

-- =============================================================
-- 10. HISTORIAL DE EDICIONES (edit_history) — 12 registros
-- =============================================================
INSERT INTO edit_history (
  product_id, previous_json, new_json, modification_reason, modified_by, modification_date
) VALUES
  (1,
   '{"name":"Paracetamol 500mg","price":3000,"cost":2000}',
   '{"name":"Paracetamol 500mg","price":3500,"cost":2200}',
   'Ajuste de precios por inflacion',
   1, '2025-03-01T10:00:00.000Z'),

  (4,
   '{"name":"Omeprazol 20mg","price":10000}',
   '{"name":"Omeprazol 20mg","price":12000}',
   'Actualizacion de precio por cambio de proveedor',
   1, '2025-04-01T14:30:00.000Z'),

  (10,
   '{"name":"Salbutamol Inhalador","price":30000}',
   '{"name":"Salbutamol Inhalador","price":35000}',
   'Revision de precios trimestral',
   1, '2025-05-01T09:00:00.000Z'),

  (5,
   '{"name":"Losartan 50mg","price":13000}',
   '{"name":"Losartan 50mg","price":15000}',
   'Incremento por cambio de presentacion',
   6, '2025-05-15T11:00:00.000Z'),

  (20,
   '{"name":"Atorvastatina 20mg","price":17000}',
   '{"name":"Atorvastatina 20mg","price":19000}',
   'Ajuste por inflacion trimestral',
   1, '2025-06-01T10:00:00.000Z'),

  (27,
   '{"name":"Insulina NPH 100UI/ml","price":40000}',
   '{"name":"Insulina NPH 100UI/ml","price":45000}',
   'Aumento por cambio proveedor insulina',
   1, '2025-06-15T11:00:00.000Z'),

  (9,
   '{"name":"Clonazepam 2mg","price":20000}',
   '{"name":"Clonazepam 2mg","price":22000}',
   'Ajuste anual precios',
   1, '2025-07-01T09:00:00.000Z'),

  (14,
   '{"name":"Ciprofloxacino 500mg","price":9500}',
   '{"name":"Ciprofloxacino 500mg","price":11000}',
   'Incremento por escasez internacional',
   1, '2025-07-15T10:00:00.000Z'),

  (6,
   '{"name":"Metformina 850mg","price":8500,"cost":5800}',
   '{"name":"Metformina 850mg","price":9800,"cost":6500}',
   'Ajuste costos y precios por inflacion',
   1, '2025-08-01T08:30:00.000Z'),

  (46,
   '{"name":"Seroquel 100mg","price":38000}',
   '{"name":"Seroquel 100mg","price":42000}',
   'Incremento por cambio proveedor',
   6, '2025-08-05T11:00:00.000Z'),

  (30,
   '{"name":"Levotiroxina 50mcg","price":10000}',
   '{"name":"Levotiroxina 50mcg","price":12000}',
   'Ajuste de precios semestral',
   1, '2025-08-10T09:00:00.000Z'),

  (62,
   '{"name":"Nebulizador Portatil","price":85000}',
   '{"name":"Nebulizador Portatil","price":95000}',
   'Incremento por devaluacion del dolar',
   1, '2025-08-15T10:00:00.000Z');

-- =============================================================
-- 11. DISPOSALS (bajas de lotes) — 8 registros
-- =============================================================
INSERT INTO disposals (batch_id, quantity, reason, disposal_date, user_id, notes) VALUES
  (78, 5, 'vencido',     '2025-07-01T09:00:00.000Z', 1, 'Lote vencido 2025-01-10. Se desecha segun protocolo farmaceutico.'),
  (79, 3, 'vencido',     '2025-07-15T09:00:00.000Z', 1, 'Lote vencido 2025-03-15. Se desecha segun protocolo farmaceutico.'),
  (12, 2, 'averiado',    '2025-08-01T09:00:00.000Z', 2, 'Tabletas danadas por golpe en bodega.'),
  (17, 1, 'averiado',    '2025-08-10T09:00:00.000Z', 3, 'Tableta danada por humedad en almacen.'),
  (56, 10, 'averiado',   '2025-08-05T10:00:00.000Z', 1, 'Jeringas danadas en transporte.'),
  (63, 3, 'averiado',    '2025-08-15T11:00:00.000Z', 2, 'Alcohol gel con envase roto.'),
  (12, 1, 'otro',        '2025-08-20T10:00:00.000Z', 1, 'Muestra clinica donada a clinica local.'),
  (9,  2, 'otro',        '2025-08-22T09:00:00.000Z', 1, 'Muestra clinica donada a clinica local.');

-- =============================================================
-- 12. NOTIFICACIONES DE STOCK BAJO — 8 registros
-- =============================================================
INSERT INTO stock_notifications (product_id, start_date, view_date) VALUES
  (5,  '2025-05-20T08:00:00.000Z', '2025-05-20T10:00:00.000Z'),
  (7,  '2025-06-15T08:00:00.000Z', '2025-06-15T09:00:00.000Z'),
  (9,  '2025-07-01T08:00:00.000Z', NULL),
  (10, '2025-07-10T08:00:00.000Z', '2025-07-10T11:00:00.000Z'),
  (26, '2025-07-20T08:00:00.000Z', NULL),
  (27, '2025-08-01T08:00:00.000Z', NULL),
  (42, '2025-08-10T08:00:00.000Z', NULL),
  (44, '2025-08-15T08:00:00.000Z', NULL);

-- =============================================================
-- FIN DEL SCRIPT
-- =============================================================
