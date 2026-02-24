function slugify(text) {
  return text
    .toString() // Asegura que es una cadena de texto
    .toLowerCase() // Convierte a minúsculas
    .normalize("NFD") // Normaliza los caracteres especiales (por ejemplo, tildes)
    .replace(/[\u0300-\u036f]/g, "") // Elimina los diacríticos (tildes y acentos)
    .replace(/[^a-z0-9\s-]/g, "") // Elimina caracteres no deseados
    .trim() // Elimina espacios al inicio y al final
    .replace(/\s+/g, "-") // Reemplaza espacios por guiones
    .replace(/-+/g, "-"); // Reemplaza múltiples guiones por uno solo
}

export default slugify