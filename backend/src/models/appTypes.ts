

interface MongoDocument {
    _id?: { $oid: string } | string;
    [key: string]: unknown;
}

export { MongoDocument };