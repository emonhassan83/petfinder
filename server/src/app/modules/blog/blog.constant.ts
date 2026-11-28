export const blogSearchAbleFields: string[] = ["title", "category"]; //* only for search term

export const blogFilterableFields: string[] = ["title", "category", "status", "tags", "searchTerm"]; //* for all filtering

export const blogSortableFields: [string, ...string[]] = ["publishedAt", "updatedAt", "title", "like"];
