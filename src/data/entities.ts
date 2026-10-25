export type FieldType =
  | "id"
  | "text"
  | "longtext"
  | "email"
  | "integer"
  | "money"
  | "boolean"
  | "timestamp"
  | "date"
  | "enum"
  | "ref"
  | "json"
  | "url";

export interface FieldDef {
  name: string;
  type: FieldType;
  required: boolean;
  unique?: boolean;
  default?: string;
  rule?: string;
  /** Untuk type "ref": entitas tujuan. */
  ref?: string;
}

export interface EntityDef {
  id: string;
  label: string;
  description: string;
  fields: FieldDef[];
  indexes: string[];
  rules: string[];
}

const ref = (name: string, target: string, required = true, rule?: string): FieldDef => ({
  name,
  type: "ref",
  ref: target,
  required,
  rule: rule ?? `FK ke ${target}`,
});

export const ENTITIES: Record<string, EntityDef> = {
  User: {
    id: "User",
    label: "Pengguna",
    description: "Akun yang bisa masuk ke aplikasi.",
    fields: [
      {
        name: "email",
        type: "email",
        required: true,
        unique: true,
        rule: "format email, huruf kecil",
      },
      { name: "name", type: "text", required: true, rule: "2–100 karakter" },
      { name: "role", type: "enum", required: true, default: "user", rule: "lihat PRD §3 Peran" },
      { name: "is_active", type: "boolean", required: true, default: "true" },
    ],
    indexes: ["email (unik)"],
    rules: ["Satu email hanya untuk satu akun."],
  },
  Organization: {
    id: "Organization",
    label: "Organisasi",
    description: "Tim/perusahaan yang menjadi wadah data (tenant).",
    fields: [
      { name: "name", type: "text", required: true, rule: "2–100 karakter" },
      {
        name: "slug",
        type: "text",
        required: true,
        unique: true,
        rule: "huruf kecil, angka, tanda hubung",
      },
    ],
    indexes: ["slug (unik)"],
    rules: ["Setiap data milik tenant wajib punya organization_id."],
  },
  Membership: {
    id: "Membership",
    label: "Keanggotaan",
    description: "Hubungan pengguna dengan organisasi beserta perannya.",
    fields: [
      ref("user_id", "User"),
      ref("organization_id", "Organization"),
      {
        name: "role",
        type: "enum",
        required: true,
        default: "member",
        rule: "owner | admin | member",
      },
    ],
    indexes: ["(user_id, organization_id) unik"],
    rules: ["Setiap organisasi minimal punya satu owner."],
  },
  Invitation: {
    id: "Invitation",
    label: "Undangan",
    description: "Undangan bergabung ke organisasi lewat email.",
    fields: [
      ref("organization_id", "Organization"),
      { name: "email", type: "email", required: true },
      { name: "token", type: "text", required: true, unique: true, rule: "acak, ≥ 32 karakter" },
      { name: "expires_at", type: "timestamp", required: true, rule: "7 hari setelah dibuat" },
      { name: "accepted_at", type: "timestamp", required: false },
    ],
    indexes: ["token (unik)", "(organization_id, email)"],
    rules: ["Undangan kedaluwarsa tidak bisa dipakai."],
  },
  Subscription: {
    id: "Subscription",
    label: "Langganan",
    description: "Paket berbayar yang aktif untuk akun/organisasi.",
    fields: [
      ref(
        "organization_id",
        "Organization",
        false,
        "FK ke Organization (atau user_id jika tanpa organisasi)",
      ),
      { name: "plan", type: "enum", required: true, rule: "free | pro | business" },
      {
        name: "status",
        type: "enum",
        required: true,
        rule: "trialing | active | past_due | canceled",
      },
      { name: "current_period_end", type: "timestamp", required: true },
      { name: "provider_ref", type: "text", required: false, rule: "ID di payment gateway" },
    ],
    indexes: ["organization_id", "provider_ref"],
    rules: ["Status hanya diubah oleh webhook payment gateway."],
  },
  Category: {
    id: "Category",
    label: "Kategori",
    description: "Pengelompokan item/produk.",
    fields: [
      { name: "name", type: "text", required: true, rule: "unik, 2–60 karakter" },
      { name: "slug", type: "text", required: true, unique: true },
    ],
    indexes: ["slug (unik)"],
    rules: [],
  },
  Product: {
    id: "Product",
    label: "Produk",
    description: "Barang/jasa yang dijual.",
    fields: [
      { name: "name", type: "text", required: true, rule: "2–120 karakter" },
      { name: "slug", type: "text", required: true, unique: true },
      { name: "description", type: "longtext", required: false },
      { name: "price", type: "money", required: true, rule: "> 0" },
      { name: "stock", type: "integer", required: true, default: "0", rule: "≥ 0" },
      { name: "image_url", type: "url", required: false },
      ref("category_id", "Category", false),
      { name: "is_published", type: "boolean", required: true, default: "false" },
    ],
    indexes: ["slug (unik)", "category_id", "is_published"],
    rules: ["Stok tidak boleh negatif.", "Produk tidak terbit tidak tampil di katalog publik."],
  },
  Store: {
    id: "Store",
    label: "Toko",
    description: "Penjual di marketplace.",
    fields: [
      ref("owner_id", "User"),
      { name: "name", type: "text", required: true },
      { name: "slug", type: "text", required: true, unique: true },
      {
        name: "status",
        type: "enum",
        required: true,
        default: "pending",
        rule: "pending | active | suspended",
      },
    ],
    indexes: ["slug (unik)", "owner_id"],
    rules: ["Hanya toko berstatus active yang produknya tampil."],
  },
  Listing: {
    id: "Listing",
    label: "Listing",
    description: "Barang/jasa yang ditawarkan penjual di marketplace.",
    fields: [
      ref("store_id", "Store"),
      ref("category_id", "Category", false),
      { name: "title", type: "text", required: true, rule: "5–120 karakter" },
      { name: "description", type: "longtext", required: true },
      { name: "price", type: "money", required: true, rule: "> 0" },
      { name: "stock", type: "integer", required: true, default: "1", rule: "≥ 0" },
      {
        name: "status",
        type: "enum",
        required: true,
        default: "draft",
        rule: "draft | active | sold_out",
      },
    ],
    indexes: ["store_id", "category_id", "status"],
    rules: ["Penjual hanya bisa mengubah listing tokonya sendiri."],
  },
  Order: {
    id: "Order",
    label: "Pesanan",
    description: "Transaksi pembelian.",
    fields: [
      {
        name: "code",
        type: "text",
        required: true,
        unique: true,
        rule: "format ORD-YYYYMMDD-XXXX",
      },
      ref("user_id", "User"),
      {
        name: "status",
        type: "enum",
        required: true,
        default: "pending",
        rule: "pending | paid | shipped | completed | canceled",
      },
      { name: "total", type: "money", required: true, rule: "= jumlah subtotal item − diskon" },
      { name: "shipping_address", type: "longtext", required: false },
      { name: "paid_at", type: "timestamp", required: false },
    ],
    indexes: ["code (unik)", "user_id", "status"],
    rules: [
      "Total dihitung di server, tidak pernah dari input klien.",
      "Pesanan paid tidak bisa diubah itemnya.",
    ],
  },
  OrderItem: {
    id: "OrderItem",
    label: "Item Pesanan",
    description: "Baris produk dalam pesanan, harga dibekukan saat checkout.",
    fields: [
      ref("order_id", "Order"),
      ref("product_id", "Product", true, "FK ke Product/Listing"),
      { name: "quantity", type: "integer", required: true, rule: "≥ 1" },
      { name: "unit_price", type: "money", required: true, rule: "salinan harga saat checkout" },
    ],
    indexes: ["order_id"],
    rules: [],
  },
  CartItem: {
    id: "CartItem",
    label: "Item Keranjang",
    description: "Produk yang disimpan pengguna sebelum checkout.",
    fields: [
      ref("user_id", "User"),
      ref("product_id", "Product"),
      { name: "quantity", type: "integer", required: true, default: "1", rule: "1–99, ≤ stok" },
    ],
    indexes: ["(user_id, product_id) unik"],
    rules: [],
  },
  Coupon: {
    id: "Coupon",
    label: "Kupon",
    description: "Kode diskon.",
    fields: [
      { name: "code", type: "text", required: true, unique: true, rule: "huruf besar & angka" },
      { name: "kind", type: "enum", required: true, rule: "percent | fixed" },
      { name: "value", type: "integer", required: true, rule: "percent 1–100, fixed > 0" },
      { name: "expires_at", type: "timestamp", required: false },
      { name: "usage_limit", type: "integer", required: false },
    ],
    indexes: ["code (unik)"],
    rules: ["Kupon kedaluwarsa atau melewati batas pemakaian ditolak."],
  },
  Review: {
    id: "Review",
    label: "Ulasan",
    description: "Penilaian pengguna terhadap produk/layanan.",
    fields: [
      ref("user_id", "User"),
      ref("product_id", "Product", true, "FK ke item yang diulas"),
      { name: "rating", type: "integer", required: true, rule: "1–5" },
      { name: "comment", type: "longtext", required: false, rule: "≤ 1.000 karakter" },
      {
        name: "status",
        type: "enum",
        required: true,
        default: "published",
        rule: "published | hidden",
      },
    ],
    indexes: ["product_id", "(user_id, product_id) unik"],
    rules: ["Satu pengguna satu ulasan per item."],
  },
  Payout: {
    id: "Payout",
    label: "Pencairan",
    description: "Pembayaran hasil penjualan ke penjual.",
    fields: [
      ref("store_id", "Store"),
      { name: "amount", type: "money", required: true, rule: "> 0, ≤ saldo" },
      {
        name: "status",
        type: "enum",
        required: true,
        default: "requested",
        rule: "requested | paid | rejected",
      },
    ],
    indexes: ["store_id", "status"],
    rules: ["Saldo tidak boleh negatif."],
  },
  Conversation: {
    id: "Conversation",
    label: "Percakapan",
    description: "Utas pesan antara dua pengguna.",
    fields: [
      ref("buyer_id", "User"),
      ref("seller_id", "User"),
      { name: "last_message_at", type: "timestamp", required: false },
    ],
    indexes: ["buyer_id", "seller_id"],
    rules: ["Hanya dua peserta yang bisa membaca percakapan."],
  },
  Message: {
    id: "Message",
    label: "Pesan",
    description: "Satu pesan di percakapan.",
    fields: [
      ref("conversation_id", "Conversation"),
      ref("sender_id", "User"),
      { name: "body", type: "longtext", required: true, rule: "1–2.000 karakter" },
      { name: "read_at", type: "timestamp", required: false },
    ],
    indexes: ["conversation_id"],
    rules: [],
  },
  Post: {
    id: "Post",
    label: "Tulisan",
    description: "Artikel/konten yang dipublikasikan.",
    fields: [
      ref("author_id", "User"),
      { name: "title", type: "text", required: true, rule: "5–150 karakter" },
      { name: "slug", type: "text", required: true, unique: true },
      { name: "body", type: "longtext", required: true },
      {
        name: "status",
        type: "enum",
        required: true,
        default: "draft",
        rule: "draft | published | archived",
      },
      { name: "published_at", type: "timestamp", required: false },
      ref("category_id", "Category", false),
    ],
    indexes: ["slug (unik)", "status, published_at"],
    rules: ["Hanya tulisan published yang tampil publik."],
  },
  Comment: {
    id: "Comment",
    label: "Komentar",
    description: "Tanggapan pengguna pada tulisan.",
    fields: [
      ref("post_id", "Post"),
      ref("user_id", "User"),
      { name: "body", type: "longtext", required: true, rule: "1–1.000 karakter" },
      {
        name: "status",
        type: "enum",
        required: true,
        default: "visible",
        rule: "visible | hidden",
      },
    ],
    indexes: ["post_id"],
    rules: [],
  },
  Tag: {
    id: "Tag",
    label: "Tag",
    description: "Label bebas untuk konten (relasi banyak-ke-banyak lewat tabel post_tags).",
    fields: [{ name: "name", type: "text", required: true, unique: true }],
    indexes: ["name (unik)"],
    rules: [],
  },
  Reaction: {
    id: "Reaction",
    label: "Reaksi",
    description: "Suka/simpan oleh pengguna pada konten.",
    fields: [
      ref("user_id", "User"),
      ref("post_id", "Post"),
      { name: "kind", type: "enum", required: true, rule: "like | bookmark" },
    ],
    indexes: ["(user_id, post_id, kind) unik"],
    rules: [],
  },
  Report: {
    id: "Report",
    label: "Laporan Konten",
    description: "Laporan pengguna atas konten yang melanggar.",
    fields: [
      ref("reporter_id", "User"),
      { name: "target_type", type: "enum", required: true, rule: "post | comment | user" },
      { name: "target_id", type: "text", required: true },
      { name: "reason", type: "text", required: true },
      {
        name: "status",
        type: "enum",
        required: true,
        default: "open",
        rule: "open | resolved | dismissed",
      },
    ],
    indexes: ["status"],
    rules: [],
  },
  Service: {
    id: "Service",
    label: "Layanan",
    description: "Layanan yang bisa dipesan.",
    fields: [
      { name: "name", type: "text", required: true },
      { name: "duration_minutes", type: "integer", required: true, rule: "15–480, kelipatan 15" },
      { name: "price", type: "money", required: true, rule: "≥ 0" },
      { name: "is_active", type: "boolean", required: true, default: "true" },
    ],
    indexes: ["is_active"],
    rules: [],
  },
  Availability: {
    id: "Availability",
    label: "Jadwal Tersedia",
    description: "Jam operasional per hari.",
    fields: [
      { name: "weekday", type: "integer", required: true, rule: "0 (Minggu) – 6 (Sabtu)" },
      { name: "start_time", type: "text", required: true, rule: "HH:mm" },
      { name: "end_time", type: "text", required: true, rule: "HH:mm, > start_time" },
    ],
    indexes: ["weekday"],
    rules: [],
  },
  Booking: {
    id: "Booking",
    label: "Reservasi",
    description: "Pemesanan slot waktu untuk layanan.",
    fields: [
      ref("service_id", "Service"),
      ref("user_id", "User", false, "FK ke User; boleh kosong untuk tamu"),
      { name: "customer_name", type: "text", required: true },
      { name: "customer_phone", type: "text", required: true, rule: "format +62…" },
      { name: "start_at", type: "timestamp", required: true },
      { name: "end_at", type: "timestamp", required: true, rule: "start_at + durasi layanan" },
      {
        name: "status",
        type: "enum",
        required: true,
        default: "pending",
        rule: "pending | confirmed | canceled | done",
      },
    ],
    indexes: ["start_at", "status"],
    rules: ["Dua reservasi confirmed tidak boleh bertumpuk waktunya untuk layanan yang sama."],
  },
  Record: {
    id: "Record",
    label: "Data Utama",
    description:
      "Data inti yang dikelola aplikasi (ganti nama sesuai domain, misal Pelanggan/Aset/Tiket).",
    fields: [
      { name: "title", type: "text", required: true, rule: "2–150 karakter" },
      {
        name: "status",
        type: "enum",
        required: true,
        default: "open",
        rule: "open | in_progress | done",
      },
      { name: "notes", type: "longtext", required: false },
      ref("owner_id", "User", false),
    ],
    indexes: ["status", "owner_id"],
    rules: [],
  },
  Approval: {
    id: "Approval",
    label: "Persetujuan",
    description: "Pengajuan yang perlu disetujui atasan/admin.",
    fields: [
      ref("record_id", "Record"),
      ref("requested_by", "User"),
      ref("decided_by", "User", false),
      {
        name: "status",
        type: "enum",
        required: true,
        default: "pending",
        rule: "pending | approved | rejected",
      },
      { name: "note", type: "longtext", required: false },
      { name: "decided_at", type: "timestamp", required: false },
    ],
    indexes: ["status", "record_id"],
    rules: ["Pengaju tidak boleh menyetujui pengajuannya sendiri."],
  },
  Page: {
    id: "Page",
    label: "Halaman",
    description: "Halaman konten statis (beranda, tentang, layanan).",
    fields: [
      { name: "slug", type: "text", required: true, unique: true },
      { name: "title", type: "text", required: true },
      { name: "content", type: "json", required: true, rule: "blok konten terstruktur" },
    ],
    indexes: ["slug (unik)"],
    rules: [],
  },
  ContactMessage: {
    id: "ContactMessage",
    label: "Pesan Kontak",
    description: "Pesan dari formulir kontak.",
    fields: [
      { name: "name", type: "text", required: true },
      { name: "email", type: "email", required: true },
      { name: "message", type: "longtext", required: true, rule: "10–2.000 karakter" },
      { name: "handled", type: "boolean", required: true, default: "false" },
    ],
    indexes: ["handled"],
    rules: [],
  },
  Subscriber: {
    id: "Subscriber",
    label: "Pelanggan Newsletter",
    description: "Email yang mendaftar newsletter.",
    fields: [
      { name: "email", type: "email", required: true, unique: true },
      { name: "confirmed_at", type: "timestamp", required: false },
      { name: "unsubscribed_at", type: "timestamp", required: false },
    ],
    indexes: ["email (unik)"],
    rules: ["Email hanya dikirimi newsletter setelah konfirmasi."],
  },
  PortfolioItem: {
    id: "PortfolioItem",
    label: "Item Portofolio",
    description: "Karya/proyek yang ditampilkan.",
    fields: [
      { name: "title", type: "text", required: true },
      { name: "image_url", type: "url", required: true },
      { name: "description", type: "longtext", required: false },
      { name: "sort_order", type: "integer", required: true, default: "0" },
    ],
    indexes: ["sort_order"],
    rules: [],
  },
  Testimonial: {
    id: "Testimonial",
    label: "Testimoni",
    description: "Kutipan pelanggan.",
    fields: [
      { name: "author_name", type: "text", required: true },
      { name: "quote", type: "longtext", required: true, rule: "≤ 400 karakter" },
      { name: "is_visible", type: "boolean", required: true, default: "true" },
    ],
    indexes: [],
    rules: [],
  },
  ToolRun: {
    id: "ToolRun",
    label: "Riwayat Proses",
    description: "Satu kali pemakaian fungsi utama alat (input + hasil).",
    fields: [
      ref("user_id", "User", false, "FK ke User; kosong jika tanpa login"),
      { name: "input", type: "json", required: true },
      { name: "output", type: "json", required: false },
      { name: "status", type: "enum", required: true, default: "done", rule: "done | failed" },
    ],
    indexes: ["user_id, created_at"],
    rules: [],
  },
  ShareLink: {
    id: "ShareLink",
    label: "Tautan Berbagi",
    description: "Tautan publik ke hasil.",
    fields: [
      ref("tool_run_id", "ToolRun"),
      { name: "token", type: "text", required: true, unique: true, rule: "acak, ≥ 16 karakter" },
      { name: "expires_at", type: "timestamp", required: false },
    ],
    indexes: ["token (unik)"],
    rules: [],
  },
  Notification: {
    id: "Notification",
    label: "Notifikasi",
    description: "Pemberitahuan dalam aplikasi.",
    fields: [
      ref("user_id", "User"),
      { name: "title", type: "text", required: true },
      { name: "link", type: "text", required: false },
      { name: "read_at", type: "timestamp", required: false },
    ],
    indexes: ["user_id, read_at"],
    rules: [],
  },
  AuditLog: {
    id: "AuditLog",
    label: "Log Aktivitas",
    description: "Catatan siapa melakukan apa (hanya ditambah, tidak pernah diubah/dihapus).",
    fields: [
      ref("actor_id", "User", false),
      { name: "action", type: "text", required: true, rule: "contoh: product.update" },
      { name: "target_type", type: "text", required: true },
      { name: "target_id", type: "text", required: true },
      { name: "changes", type: "json", required: false, rule: "nilai sebelum & sesudah" },
    ],
    indexes: ["target_type, target_id", "actor_id"],
    rules: ["Tabel append-only."],
  },
  FileAsset: {
    id: "FileAsset",
    label: "Berkas",
    description: "Metadata berkas yang diunggah (isinya di penyimpanan objek).",
    fields: [
      ref("uploaded_by", "User", false),
      { name: "storage_key", type: "text", required: true, unique: true },
      {
        name: "mime_type",
        type: "text",
        required: true,
        rule: "daftar putih: image/*, application/pdf",
      },
      { name: "size_bytes", type: "integer", required: true, rule: "≤ 5 MB" },
    ],
    indexes: ["storage_key (unik)"],
    rules: [],
  },
};
