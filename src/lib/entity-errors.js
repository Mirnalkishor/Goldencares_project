export async function getEntityOrNull(entity, id) {
  try {
    return await entity.get(id);
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}
