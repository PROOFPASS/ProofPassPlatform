from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
import graphviz
import os

# Crear PDF
pdf_path = "ProofPass_Developer_Handbook.pdf"
doc = SimpleDocTemplate(pdf_path, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CustomTitle", fontSize=20, spaceAfter=20))
styles.add(ParagraphStyle(name="CustomHeading", fontSize=14, spaceAfter=10))
styles.add(ParagraphStyle(name="CustomBody", fontSize=11, leading=15))

story = []

# --- Portada ---
story.append(Paragraph("ProofPass Platform — Developer Handbook", styles["Title"]))
story.append(Paragraph("Xcapit Blockchain & AI Lab — Noviembre 2025", styles["Body"]))
story.append(Spacer(1, 20))

intro = """
ProofPass Platform es una solución basada en Fastify y TypeScript que permite emitir, verificar y anclar credenciales verificables (VC)
en la blockchain de Stellar, así como generar y validar pruebas de conocimiento cero (ZKP). Este documento describe su arquitectura,
módulos principales, flujos de funcionamiento y recomendaciones de desarrollo.
"""
story.append(Paragraph(intro, styles["Body"]))
story.append(PageBreak())

# --- Diagrama de Arquitectura ---
arch = graphviz.Digraph(format="png")
arch.attr(rankdir="TB", bgcolor="white")
arch.node("UI", "Clientes / Verificadores", shape="box", style="filled", fillcolor="#E3F2FD")
arch.node("API", "API Fastify (Auth, VC, ZKP, Passports)", shape="box", style="filled", fillcolor="#C8E6C9")
arch.node("VC", "VC Toolkit", shape="ellipse", fillcolor="#FFF9C4", style="filled")
arch.node("ST", "Stellar SDK", shape="ellipse", fillcolor="#FFF9C4", style="filled")
arch.node("ZK", "ZK Toolkit", shape="ellipse", fillcolor="#FFE0B2", style="filled")
arch.node("DB", "PostgreSQL", shape="cylinder", fillcolor="#BBDEFB", style="filled")
arch.node("R", "Redis", shape="cylinder", fillcolor="#BBDEFB", style="filled")

arch.edges([("UI", "API"), ("API", "VC"), ("API", "ST"), ("API", "ZK"), ("API", "DB"), ("API", "R")])
arch.render("architecture_diagram", cleanup=True)
story.append(Paragraph("Arquitectura general del sistema", styles["Heading"]))
story.append(Image("architecture_diagram.png", width=15*cm, height=10*cm))
story.append(PageBreak())

# --- Detalle de módulos ---
story.append(Paragraph("Módulos principales", styles["Heading"]))
modules = """
**Auth**: Gestiona usuarios, API keys y JWT.  
**Attestations**: Crea, firma y ancla credenciales verificables en Stellar.  
**Passports**: Agrupa atestaciones bajo un mismo producto.  
**ZKP**: Genera y valida pruebas de conocimiento cero (threshold, range, set).  
**VC Toolkit**: Implementa el estándar W3C Verifiable Credentials.  
**Stellar SDK**: Maneja anclado de hashes y validación on-chain.  
**ZK Toolkit**: Biblioteca para pruebas ZK simuladas.  
"""
story.append(Paragraph(modules.replace("\n", "<br/>"), styles["Body"]))
story.append(PageBreak())

# --- Flujos End-to-End ---
seq = graphviz.Digraph(format="png")
seq.attr(rankdir="LR", bgcolor="white")
seq.node("U", "Usuario Emisor", shape="ellipse", style="filled", fillcolor="#E1BEE7")
seq.node("API", "API Fastify", shape="box", style="filled", fillcolor="#C8E6C9")
seq.node("VC", "VC Toolkit", shape="ellipse", style="filled", fillcolor="#FFF9C4")
seq.node("ST", "Stellar SDK", shape="ellipse", style="filled", fillcolor="#FFF9C4")
seq.node("DB", "PostgreSQL", shape="cylinder", style="filled", fillcolor="#BBDEFB")

seq.edge("U", "API", "POST /attestations")
seq.edge("API", "VC", "Crea VC + firma")
seq.edge("API", "ST", "Ancla hash VC")
seq.edge("ST", "API", "txHash")
seq.edge("API", "DB", "Guarda VC + QR")
seq.edge("API", "U", "Retorna QR + VC")

seq.render("sequence_flow", cleanup=True)
story.append(Paragraph("Flujo de emisión de atestación", styles["Heading"]))
story.append(Image("sequence_flow.png", width=15*cm, height=9*cm))
story.append(PageBreak())

# --- Seguridad y Roadmap ---
security = """
- Autenticación con JWT y control de API keys.  
- Rate limiting con Redis.  
- Validación de entrada con Zod.  
- CORS restringido y Helmet activado.  
- Almacenamiento de secretos en entorno seguro.  
"""
story.append(Paragraph("Seguridad y buenas prácticas", styles["Heading"]))
story.append(Paragraph(security.replace("\n", "<br/>"), styles["Body"]))
story.append(Spacer(1, 10))

roadmap = """
1. Integrar DIDs y LD-Proofs.  
2. Reemplazar pruebas ZK simuladas por circuitos reales (Circom, Halo2).  
3. Añadir auditoría y observabilidad (OpenTelemetry, Prometheus).  
4. Migrar gestión de claves a Vault/KMS.  
"""
story.append(Paragraph("Roadmap técnico", styles["Heading"]))
story.append(Paragraph(roadmap.replace("\n", "<br/>"), styles["Body"]))

doc.build(story)
print(f"PDF generado: {pdf_path}")
