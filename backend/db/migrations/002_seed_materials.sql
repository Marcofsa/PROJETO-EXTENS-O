-- 002_seed_materials.sql
-- Insere exemplo de materiais (15 registros)

INSERT OR IGNORE INTO materials(id,nome,categoria,subcategoria,unidade,pegada_carbono,energia_incorporada,consumo_agua,custo_unitario,selos_verdes,distancia_media_transporte,transporte_tipo,score_sustentabilidade,nivel_sustentabilidade,criado_em)
VALUES
('concreto_c30_mp','Concreto C30 - MP','estrutural','concreto','m³',280,1200,150,450,4,50,'caminhão basculante',8.2,'alto',datetime('now')),
('aco_ca25','Aço CA-25','estrutural','aço','kg',1.85,15,10,4.5,2,200,'caminhão',6.0,'médio',datetime('now')),
('tijolo_ceramico','Tijolo Cerâmico','vedacao','tijolo','un',8.0,10,5,0.45,1,100,'caminhão',5.2,'médio',datetime('now')),
('bloco_concreto','Bloco de Concreto','vedacao','bloco','un',12.0,20,8,1.2,1,80,'caminhão',5.5,'médio',datetime('now')),
('madeira_certificada','Madeira Certificada','acabamento','madeira','m³',45,200,50,1200,5,300,'caminhão',8.5,'alto',datetime('now')),
('madeira_tratada','Madeira Tratada','estrutural','madeira','m³',60,220,60,850,3,300,'caminhão',6.5,'médio',datetime('now')),
('vidro_float','Vidro Float','acabamento','vidro','m²',25,150,10,40,2,400,'caminhão',6.8,'médio',datetime('now')),
('drywall','Drywall','vedacao','drywall','m²',5,40,2,18,2,120,'caminhão',7.0,'médio',datetime('now')),
('lã_de_vidro','Lã de Vidro','isolamento','lã','m²',3,60,1,10,1,200,'caminhão',6.2,'médio',datetime('now')),
('eps','EPS','isolamento','poliestireno','m³',2.5,30,0.5,120,0,500,'caminhão',4.5,'baixo',datetime('now')),
('revestimento_ceramico','Revestimento Cerâmico','acabamento','revestimento','m²',7,25,2,35,2,150,'caminhão',6.0,'médio',datetime('now')),
('tinta_ecologica','Tinta Ecológica','acabamento','tinta','l',1.2,5,0.2,28,3,50,'caminhão',7.2,'alto',datetime('now')),
('argamassa','Argamassa Padrão','acabamento','argamassa','kg',0.8,8,1.5,3.5,1,60,'caminhão',5.0,'médio',datetime('now')),
('telha_metalica','Telha Metálica','estrutura','telha','m²',15,90,2,55,2,400,'caminhão',5.8,'médio',datetime('now')),
('telha_ceramica','Telha Cerâmica','estrutura','telha','m²',18,70,5,42,1,100,'caminhão',5.6,'médio',datetime('now'));
