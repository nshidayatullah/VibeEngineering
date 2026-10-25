export type AppType =
  | "landing"
  | "ecommerce"
  | "saas"
  | "internal"
  | "marketplace"
  | "content"
  | "booking"
  | "tool";

export type Access = "Publik" | "Login" | "Admin";

export interface FeatureDef {
  id: string;
  label: string;
  description: string;
  /** Jenis aplikasi yang menawarkan fitur ini di FEA-01. Kosong = fitur pendukung (FEA-04). */
  appTypes: AppType[];
  /** Direkomendasikan sebagai Must saat AI menentukan prioritas. */
  core?: boolean;
  /** Fitur yang memicu pertanyaan pembayaran (PAY-01). */
  transactional?: boolean;
  story: { role: string; action: string; benefit: string };
  /** Kriteria penerimaan format EARS, tanpa prefiks ID. */
  acceptance: string[];
  edgeCases: string;
  entities: string[];
  /** path kosong = fitur pendukung yang menempel di halaman fitur lain. */
  route: { path: string; name: string; access: Access };
}

export const FEATURES: FeatureDef[] = [
  // Landing page / company profile
  {
    id: "pages",
    label: "Halaman profil & layanan",
    description: "Beranda, tentang kami, dan daftar layanan yang isinya bisa diubah admin.",
    appTypes: ["landing"],
    core: true,
    story: {
      role: "pengunjung",
      action: "membaca profil dan layanan",
      benefit: "saya paham apa yang ditawarkan",
    },
    acceptance: [
      "KETIKA pengunjung membuka /, SISTEM HARUS menampilkan hero, ringkasan layanan, dan ajakan aksi dalam satu layar pertama",
      "KETIKA admin menyimpan perubahan halaman, SISTEM HARUS menampilkan versi baru tanpa deploy ulang",
      "SISTEM HARUS menyediakan judul dan meta description unik untuk setiap halaman",
    ],
    edgeCases: "Halaman yang slug-nya tidak ada menampilkan halaman 404 dengan tautan ke beranda.",
    entities: ["Page"],
    route: { path: "/", name: "Beranda", access: "Publik" },
  },
  {
    id: "contact",
    label: "Formulir kontak",
    description: "Pengunjung mengirim pesan; admin menerima notifikasi.",
    appTypes: ["landing", "booking"],
    core: true,
    story: {
      role: "pengunjung",
      action: "mengirim pertanyaan lewat formulir",
      benefit: "saya bisa dihubungi kembali",
    },
    acceptance: [
      "KETIKA pengunjung mengirim formulir yang valid, SISTEM HARUS menyimpan pesan dan menampilkan konfirmasi",
      "JIKA email tidak valid atau pesan < 10 karakter, MAKA SISTEM HARUS menampilkan pesan error di field terkait",
      "JIKA satu alamat IP mengirim > 5 pesan dalam 10 menit, MAKA SISTEM HARUS menolak pengiriman berikutnya",
    ],
    edgeCases: "Pengiriman ganda karena tombol ditekan dua kali hanya menyimpan satu pesan.",
    entities: ["ContactMessage"],
    route: { path: "/kontak", name: "Kontak", access: "Publik" },
  },
  {
    id: "gallery",
    label: "Portofolio / galeri",
    description: "Daftar karya dengan gambar.",
    appTypes: ["landing"],
    story: {
      role: "pengunjung",
      action: "melihat contoh karya",
      benefit: "saya yakin dengan kualitasnya",
    },
    acceptance: [
      "KETIKA pengunjung membuka /portofolio, SISTEM HARUS menampilkan item urut sort_order",
      "KETIKA gambar dimuat, SISTEM HARUS memakai lazy loading dan ukuran responsif",
    ],
    edgeCases: "Gambar gagal dimuat menampilkan placeholder netral.",
    entities: ["PortfolioItem"],
    route: { path: "/portofolio", name: "Portofolio", access: "Publik" },
  },
  {
    id: "testimonials",
    label: "Testimoni",
    description: "Kutipan pelanggan di beranda.",
    appTypes: ["landing"],
    story: {
      role: "pengunjung",
      action: "membaca pengalaman pelanggan lain",
      benefit: "saya lebih percaya",
    },
    acceptance: ["SISTEM HARUS menampilkan maksimal 6 testimoni yang is_visible = true di beranda"],
    edgeCases: "Jika tidak ada testimoni terlihat, bagian testimoni disembunyikan.",
    entities: ["Testimonial"],
    route: { path: "/", name: "Beranda", access: "Publik" },
  },
  {
    id: "newsletter",
    label: "Pendaftaran newsletter",
    description: "Pengunjung mendaftar email dengan konfirmasi ganda.",
    appTypes: ["landing", "content"],
    story: {
      role: "pengunjung",
      action: "mendaftar newsletter",
      benefit: "saya mendapat kabar terbaru",
    },
    acceptance: [
      "KETIKA pengunjung mendaftar, SISTEM HARUS mengirim email konfirmasi berisi tautan sekali pakai",
      "KETIKA tautan konfirmasi dibuka, SISTEM HARUS mengisi confirmed_at",
      "JIKA email sudah terdaftar, MAKA SISTEM HARUS menampilkan pesan yang sama seperti pendaftaran baru (tidak membocorkan data)",
    ],
    edgeCases: "Tautan berhenti langganan selalu tersedia di setiap email.",
    entities: ["Subscriber"],
    route: { path: "/newsletter", name: "Newsletter", access: "Publik" },
  },
  // E-commerce
  {
    id: "catalog",
    label: "Katalog produk",
    description: "Daftar dan detail produk yang terbit.",
    appTypes: ["ecommerce", "marketplace"],
    core: true,
    story: {
      role: "pembeli",
      action: "melihat produk dan detailnya",
      benefit: "saya bisa memilih yang ingin dibeli",
    },
    acceptance: [
      "KETIKA pembeli membuka /produk, SISTEM HARUS menampilkan produk terbit 24 per halaman",
      "KETIKA pembeli membuka /produk/[slug], SISTEM HARUS menampilkan nama, harga, stok, gambar, dan deskripsi",
      "JIKA stok = 0, MAKA SISTEM HARUS menampilkan label Habis dan menonaktifkan tombol beli",
    ],
    edgeCases: "Produk yang tidak terbit mengembalikan 404 untuk publik.",
    entities: ["Product", "Category"],
    route: { path: "/produk", name: "Katalog", access: "Publik" },
  },
  {
    id: "cart",
    label: "Keranjang",
    description: "Menyimpan produk sebelum checkout.",
    appTypes: ["ecommerce", "marketplace"],
    core: true,
    story: {
      role: "pembeli",
      action: "mengumpulkan produk di keranjang",
      benefit: "saya bisa membayar sekaligus",
    },
    acceptance: [
      "KETIKA pembeli menambah produk, SISTEM HARUS memperbarui jumlah item di ikon keranjang",
      "JIKA jumlah melebihi stok, MAKA SISTEM HARUS membatasi jumlah ke stok tersedia dan menampilkan pesan",
      "KETIKA keranjang kosong, SISTEM HARUS menonaktifkan tombol Checkout",
    ],
    edgeCases:
      "Harga di keranjang selalu harga terbaru; perubahan harga ditampilkan sebelum checkout.",
    entities: ["CartItem", "Product"],
    route: { path: "/keranjang", name: "Keranjang", access: "Login" },
  },
  {
    id: "checkout",
    label: "Checkout & pembayaran",
    description: "Alamat, ringkasan, pembayaran, lalu pesanan tercatat.",
    appTypes: ["ecommerce", "marketplace"],
    core: true,
    transactional: true,
    story: { role: "pembeli", action: "membayar isi keranjang", benefit: "pesanan saya diproses" },
    acceptance: [
      "KETIKA pembeli menekan Bayar, SISTEM HARUS menghitung ulang total di server dari harga & stok terbaru",
      "KETIKA pembayaran berhasil, SISTEM HARUS mengubah status pesanan menjadi paid, mengurangi stok, dan mengosongkan keranjang",
      "JIKA stok tidak cukup saat checkout, MAKA SISTEM HARUS membatalkan proses dan menampilkan item yang bermasalah",
      "JIKA pembayaran gagal atau kedaluwarsa, MAKA SISTEM HARUS mempertahankan pesanan berstatus pending dan stok tidak berubah",
    ],
    edgeCases: "Notifikasi pembayaran (webhook) yang datang dua kali hanya diproses sekali.",
    entities: ["Order", "OrderItem"],
    route: { path: "/checkout", name: "Checkout", access: "Login" },
  },
  {
    id: "orders",
    label: "Riwayat pesanan",
    description: "Pembeli melihat status pesanannya; admin mengelola pesanan.",
    appTypes: ["ecommerce", "marketplace"],
    core: true,
    story: {
      role: "pembeli",
      action: "melihat status pesanan saya",
      benefit: "saya tahu kapan barang datang",
    },
    acceptance: [
      "KETIKA pembeli membuka /pesanan, SISTEM HARUS menampilkan pesanan miliknya saja, terbaru di atas",
      "KETIKA admin mengubah status pesanan, SISTEM HARUS mencatat waktu perubahan",
      "JIKA pengguna membuka pesanan milik orang lain, MAKA SISTEM HARUS mengembalikan 404",
    ],
    edgeCases: "Pesanan pending lebih dari 24 jam otomatis dibatalkan.",
    entities: ["Order", "OrderItem"],
    route: { path: "/pesanan", name: "Pesanan saya", access: "Login" },
  },
  {
    id: "inventory",
    label: "Manajemen stok & produk",
    description: "Admin menambah, mengubah, dan menerbitkan produk serta stok.",
    appTypes: ["ecommerce"],
    core: true,
    story: { role: "admin", action: "mengelola produk dan stok", benefit: "katalog selalu akurat" },
    acceptance: [
      "KETIKA admin menyimpan produk, SISTEM HARUS memvalidasi nama, harga > 0, dan stok ≥ 0 di server",
      "JIKA slug sudah dipakai, MAKA SISTEM HARUS menampilkan error di field slug",
      "KETIKA stok produk < 5, SISTEM HARUS menandai produk di daftar admin",
    ],
    edgeCases:
      "Produk yang sudah pernah dipesan tidak bisa dihapus permanen, hanya diturunkan dari katalog.",
    entities: ["Product", "Category"],
    route: { path: "/admin/produk", name: "Kelola produk", access: "Admin" },
  },
  {
    id: "coupons",
    label: "Kupon / diskon",
    description: "Kode diskon persen atau nominal.",
    appTypes: ["ecommerce"],
    story: {
      role: "pembeli",
      action: "memakai kode kupon",
      benefit: "saya mendapat potongan harga",
    },
    acceptance: [
      "KETIKA kupon valid diterapkan, SISTEM HARUS menampilkan potongan dan total baru",
      "JIKA kupon kedaluwarsa atau melewati batas pakai, MAKA SISTEM HARUS menolak dengan pesan yang jelas",
    ],
    edgeCases: "Diskon tidak boleh membuat total < 0.",
    entities: ["Coupon"],
    route: { path: "/checkout", name: "Checkout", access: "Login" },
  },
  {
    id: "reviews",
    label: "Ulasan",
    description: "Rating 1–5 dan komentar untuk produk.",
    appTypes: ["ecommerce", "marketplace", "booking"],
    story: { role: "pembeli", action: "memberi ulasan", benefit: "pembeli lain terbantu memilih" },
    acceptance: [
      "KETIKA pembeli yang pernah membeli mengirim ulasan, SISTEM HARUS menyimpan dan menampilkannya di detail item",
      "JIKA pengguna belum pernah membeli item, MAKA SISTEM HARUS menyembunyikan formulir ulasan",
      "SISTEM HARUS menampilkan rata-rata rating dengan satu desimal",
    ],
    edgeCases: "Admin bisa menyembunyikan ulasan yang melanggar tanpa menghapusnya.",
    entities: ["Review"],
    route: { path: "/produk/[slug]", name: "Detail produk", access: "Publik" },
  },
  {
    id: "email_notif",
    label: "Notifikasi email transaksi",
    description: "Email konfirmasi pesanan dan perubahan status.",
    appTypes: ["ecommerce", "marketplace", "booking"],
    story: {
      role: "pembeli",
      action: "menerima email konfirmasi",
      benefit: "saya punya bukti transaksi",
    },
    acceptance: [
      "KETIKA status pesanan berubah, SISTEM HARUS mengirim email ke pemilik pesanan dalam 1 menit",
      "JIKA pengiriman email gagal, MAKA SISTEM HARUS mencoba ulang maksimal 3 kali dan mencatat kegagalan",
    ],
    edgeCases: "Kegagalan email tidak membatalkan transaksi.",
    entities: ["Order"],
    route: { path: "/pesanan", name: "Pesanan saya", access: "Login" },
  },
  // Marketplace
  {
    id: "seller",
    label: "Pendaftaran & toko penjual",
    description: "Pengguna membuka toko; admin menyetujui.",
    appTypes: ["marketplace"],
    core: true,
    story: { role: "penjual", action: "membuka toko", benefit: "saya bisa berjualan" },
    acceptance: [
      "KETIKA pengguna mendaftar toko, SISTEM HARUS membuat toko berstatus pending",
      "KETIKA admin menyetujui toko, SISTEM HARUS mengubah status menjadi active dan memberi tahu penjual",
      "SELAMA toko berstatus pending atau suspended, SISTEM HARUS menyembunyikan listing toko tersebut",
    ],
    edgeCases: "Satu pengguna maksimal satu toko.",
    entities: ["Store", "User"],
    route: { path: "/toko/saya", name: "Toko saya", access: "Login" },
  },
  {
    id: "listings",
    label: "Kelola listing penjual",
    description: "Penjual membuat dan mengubah listing barang/jasa.",
    appTypes: ["marketplace"],
    core: true,
    story: { role: "penjual", action: "membuat listing", benefit: "barang saya terlihat pembeli" },
    acceptance: [
      "KETIKA penjual menyimpan listing, SISTEM HARUS memvalidasi judul, harga, dan stok di server",
      "JIKA penjual mengubah listing toko lain, MAKA SISTEM HARUS menolak dengan 403",
    ],
    edgeCases: "Listing dengan stok 0 otomatis berstatus sold_out.",
    entities: ["Listing", "Store"],
    route: { path: "/toko/saya/listing", name: "Listing saya", access: "Login" },
  },
  {
    id: "payouts",
    label: "Saldo & pencairan penjual",
    description: "Penjual melihat saldo dan mengajukan pencairan.",
    appTypes: ["marketplace"],
    transactional: true,
    story: {
      role: "penjual",
      action: "mencairkan hasil penjualan",
      benefit: "saya menerima uang saya",
    },
    acceptance: [
      "KETIKA pesanan selesai, SISTEM HARUS menambah saldo penjual sebesar total dikurangi komisi",
      "JIKA jumlah pencairan > saldo, MAKA SISTEM HARUS menolak pengajuan",
    ],
    edgeCases: "Pengajuan pencairan ganda saat masih ada yang requested ditolak.",
    entities: ["Payout", "Store"],
    route: { path: "/toko/saya/saldo", name: "Saldo", access: "Login" },
  },
  {
    id: "chat",
    label: "Pesan pembeli–penjual",
    description: "Percakapan satu-ke-satu.",
    appTypes: ["marketplace"],
    story: {
      role: "pembeli",
      action: "bertanya ke penjual",
      benefit: "saya yakin sebelum membeli",
    },
    acceptance: [
      "KETIKA pengguna mengirim pesan, SISTEM HARUS menampilkannya di percakapan kedua pihak",
      "JIKA pengguna bukan peserta percakapan, MAKA SISTEM HARUS menolak akses",
    ],
    edgeCases: "Pesan kosong atau hanya spasi tidak bisa dikirim.",
    entities: ["Conversation", "Message"],
    route: { path: "/pesan", name: "Pesan", access: "Login" },
  },
  // SaaS
  {
    id: "onboarding",
    label: "Onboarding pengguna baru",
    description: "Langkah awal setelah daftar: profil, workspace, contoh data.",
    appTypes: ["saas"],
    core: true,
    story: {
      role: "pengguna baru",
      action: "menyiapkan akun",
      benefit: "saya cepat merasakan manfaat aplikasi",
    },
    acceptance: [
      "KETIKA pengguna pertama kali masuk, SISTEM HARUS menampilkan onboarding maksimal 3 langkah",
      "KETIKA onboarding selesai atau dilewati, SISTEM HARUS tidak menampilkannya lagi",
    ],
    edgeCases: "Menutup browser di tengah onboarding melanjutkan dari langkah terakhir.",
    entities: ["User"],
    route: { path: "/mulai", name: "Onboarding", access: "Login" },
  },
  {
    id: "workspace",
    label: "Workspace / organisasi",
    description: "Pengguna membuat organisasi dan berpindah antar organisasi.",
    appTypes: ["saas"],
    core: true,
    story: {
      role: "pemilik akun",
      action: "membuat workspace tim",
      benefit: "data tim terpisah dari tim lain",
    },
    acceptance: [
      "KETIKA pengguna membuat workspace, SISTEM HARUS menjadikannya owner",
      "SISTEM HARUS membatasi setiap query data ke organization_id workspace aktif",
      "JIKA pengguna membuka data workspace yang bukan miliknya, MAKA SISTEM HARUS mengembalikan 404",
    ],
    edgeCases: "Owner terakhir tidak bisa keluar dari workspace.",
    entities: ["Organization", "Membership"],
    route: { path: "/w/[slug]", name: "Workspace", access: "Login" },
  },
  {
    id: "core_crud",
    label: "Modul inti (kelola data utama)",
    description: "Buat, lihat, ubah, hapus data inti produk SaaS.",
    appTypes: ["saas", "tool"],
    core: true,
    story: {
      role: "pengguna",
      action: "mengelola data utama",
      benefit: "pekerjaan inti saya selesai di aplikasi",
    },
    acceptance: [
      "KETIKA pengguna menyimpan data, SISTEM HARUS memvalidasi input di server dan menampilkan toast berhasil",
      "KETIKA pengguna membuka daftar, SISTEM HARUS menampilkan 20 data per halaman",
      "KETIKA pengguna menghapus data, SISTEM HARUS meminta konfirmasi terlebih dahulu",
    ],
    edgeCases:
      "Dua pengguna mengubah data yang sama: perubahan terakhir menang dan updated_at diperbarui.",
    entities: ["Record"],
    route: { path: "/data", name: "Data", access: "Login" },
  },
  {
    id: "billing",
    label: "Langganan & tagihan",
    description: "Paket, upgrade, dan status langganan.",
    appTypes: ["saas"],
    core: true,
    transactional: true,
    story: {
      role: "pemilik akun",
      action: "berlangganan paket berbayar",
      benefit: "saya mendapat fitur penuh",
    },
    acceptance: [
      "KETIKA pembayaran langganan berhasil, SISTEM HARUS mengaktifkan paket sesuai webhook payment gateway",
      "SELAMA langganan berstatus past_due, SISTEM HARUS menampilkan banner pembayaran",
      "JIKA batas paket gratis tercapai, MAKA SISTEM HARUS menampilkan ajakan upgrade dan menolak penambahan data",
    ],
    edgeCases: "Webhook yang sama diproses sekali saja (idempoten).",
    entities: ["Subscription", "Organization"],
    route: { path: "/pengaturan/tagihan", name: "Tagihan", access: "Login" },
  },
  {
    id: "invites",
    label: "Undang anggota tim",
    description: "Owner/admin mengundang lewat email.",
    appTypes: ["saas", "internal"],
    story: { role: "admin workspace", action: "mengundang rekan", benefit: "kami bekerja bersama" },
    acceptance: [
      "KETIKA admin mengundang email, SISTEM HARUS mengirim tautan undangan yang berlaku 7 hari",
      "KETIKA undangan diterima, SISTEM HARUS membuat keanggotaan dengan peran yang dipilih",
      "JIKA undangan kedaluwarsa, MAKA SISTEM HARUS menampilkan pesan dan tawaran minta undangan ulang",
    ],
    edgeCases: "Mengundang email yang sudah menjadi anggota ditolak.",
    entities: ["Invitation", "Organization", "Membership"],
    route: { path: "/pengaturan/anggota", name: "Anggota", access: "Admin" },
  },
  {
    id: "settings",
    label: "Pengaturan akun",
    description: "Ubah nama, email, kata sandi, preferensi.",
    appTypes: ["saas", "tool"],
    story: { role: "pengguna", action: "mengubah profil", benefit: "data akun saya benar" },
    acceptance: [
      "KETIKA pengguna menyimpan profil, SISTEM HARUS memvalidasi dan menampilkan toast berhasil",
      "KETIKA email diubah, SISTEM HARUS meminta verifikasi ke email baru sebelum diganti",
    ],
    edgeCases: "Menghapus akun meminta konfirmasi dengan mengetik nama akun.",
    entities: ["User"],
    route: { path: "/pengaturan", name: "Pengaturan", access: "Login" },
  },
  // Internal / dashboard
  {
    id: "records",
    label: "Kelola data (CRUD) operasional",
    description: "Tabel data dengan tambah/ubah/hapus untuk staf.",
    appTypes: ["internal"],
    core: true,
    story: {
      role: "staf",
      action: "mencatat dan memperbarui data",
      benefit: "tidak perlu spreadsheet manual",
    },
    acceptance: [
      "KETIKA staf menyimpan data, SISTEM HARUS memvalidasi input di server",
      "KETIKA staf membuka daftar, SISTEM HARUS menampilkan 50 baris per halaman dengan kolom bisa diurutkan",
      "JIKA staf tidak punya izin ubah, MAKA SISTEM HARUS menyembunyikan tombol ubah dan menolak permintaan di server",
    ],
    edgeCases: "Data yang sedang dipakai di pengajuan tidak bisa dihapus.",
    entities: ["Record"],
    route: { path: "/data", name: "Data", access: "Login" },
  },
  {
    id: "approval",
    label: "Alur persetujuan",
    description: "Pengajuan → disetujui/ditolak atasan.",
    appTypes: ["internal"],
    core: true,
    story: {
      role: "staf",
      action: "mengajukan persetujuan",
      benefit: "keputusan tercatat dan cepat",
    },
    acceptance: [
      "KETIKA staf mengajukan, SISTEM HARUS membuat persetujuan berstatus pending dan memberi tahu penyetuju",
      "KETIKA penyetuju memutuskan, SISTEM HARUS mencatat penyetuju, waktu, dan catatan",
      "JIKA pengaju mencoba menyetujui pengajuannya sendiri, MAKA SISTEM HARUS menolak",
    ],
    edgeCases: "Pengajuan yang sudah diputuskan tidak bisa diubah, hanya diajukan ulang.",
    entities: ["Approval", "Record"],
    route: { path: "/persetujuan", name: "Persetujuan", access: "Login" },
  },
  {
    id: "reports",
    label: "Laporan & rekap",
    description: "Rekap per periode yang bisa difilter.",
    appTypes: ["internal"],
    story: {
      role: "manajer",
      action: "melihat rekap per periode",
      benefit: "saya bisa mengambil keputusan",
    },
    acceptance: [
      "KETIKA manajer memilih rentang tanggal, SISTEM HARUS menampilkan rekap untuk rentang tersebut",
      "SISTEM HARUS memuat laporan ≤ 2 detik untuk 1 tahun data",
    ],
    edgeCases: "Rentang tanpa data menampilkan status kosong, bukan error.",
    entities: ["Record"],
    route: { path: "/laporan", name: "Laporan", access: "Login" },
  },
  {
    id: "user_mgmt",
    label: "Manajemen pengguna & peran",
    description: "Admin menambah pengguna dan mengatur perannya.",
    appTypes: ["internal"],
    core: true,
    story: {
      role: "admin",
      action: "mengatur pengguna dan peran",
      benefit: "akses sesuai tanggung jawab",
    },
    acceptance: [
      "KETIKA admin menambah pengguna, SISTEM HARUS mengirim email undangan untuk membuat kata sandi",
      "KETIKA admin menonaktifkan pengguna, SISTEM HARUS mengakhiri semua sesinya",
      "JIKA admin terakhir mencoba menurunkan perannya sendiri, MAKA SISTEM HARUS menolak",
    ],
    edgeCases: "Pengguna nonaktif tidak bisa login, datanya tetap ada.",
    entities: ["User"],
    route: { path: "/admin/pengguna", name: "Pengguna", access: "Admin" },
  },
  {
    id: "dashboard",
    label: "Dashboard ringkasan",
    description: "Angka kunci dan grafik di halaman utama.",
    appTypes: ["internal", "saas"],
    story: {
      role: "pengguna",
      action: "melihat ringkasan angka penting",
      benefit: "saya tahu kondisi terkini",
    },
    acceptance: [
      "KETIKA pengguna membuka dashboard, SISTEM HARUS menampilkan 3–6 angka kunci dengan pembanding periode sebelumnya",
      "SISTEM HARUS memuat dashboard ≤ 2 detik",
    ],
    edgeCases: "Tanpa data menampilkan status kosong dengan ajakan menambah data pertama.",
    entities: ["Record"],
    route: { path: "/dashboard", name: "Dashboard", access: "Login" },
  },
  // Konten / komunitas
  {
    id: "posts",
    label: "Tulisan / artikel",
    description: "Membuat, menerbitkan, dan membaca tulisan.",
    appTypes: ["content"],
    core: true,
    story: {
      role: "penulis",
      action: "menerbitkan tulisan",
      benefit: "pembaca bisa menemukan konten saya",
    },
    acceptance: [
      "KETIKA penulis menerbitkan tulisan, SISTEM HARUS mengisi published_at dan menampilkannya di daftar publik",
      "KETIKA pembaca membuka /tulisan/[slug], SISTEM HARUS menampilkan judul, penulis, tanggal, dan isi",
      "SELAMA tulisan berstatus draft, SISTEM HARUS hanya menampilkannya ke penulis dan admin",
    ],
    edgeCases: "Mengubah judul tidak mengubah slug yang sudah terbit.",
    entities: ["Post", "User"],
    route: { path: "/tulisan", name: "Tulisan", access: "Publik" },
  },
  {
    id: "comments",
    label: "Komentar",
    description: "Pembaca berkomentar di tulisan.",
    appTypes: ["content"],
    story: { role: "pembaca", action: "berkomentar", benefit: "saya bisa berdiskusi" },
    acceptance: [
      "KETIKA pengguna login mengirim komentar, SISTEM HARUS menampilkannya di bawah tulisan",
      "JIKA komentar kosong atau > 1.000 karakter, MAKA SISTEM HARUS menolak dengan pesan",
    ],
    edgeCases: "Komentar yang disembunyikan admin tidak tampil, tetapi tetap tersimpan.",
    entities: ["Comment", "Post"],
    route: { path: "/tulisan/[slug]", name: "Detail tulisan", access: "Publik" },
  },
  {
    id: "taxonomy",
    label: "Kategori & tag",
    description: "Mengelompokkan konten.",
    appTypes: ["content"],
    story: {
      role: "pembaca",
      action: "menelusuri per kategori/tag",
      benefit: "saya cepat menemukan topik",
    },
    acceptance: [
      "KETIKA pembaca membuka /kategori/[slug], SISTEM HARUS menampilkan tulisan terbit di kategori itu",
    ],
    edgeCases: "Kategori tanpa tulisan menampilkan status kosong.",
    entities: ["Category", "Tag"],
    route: { path: "/kategori/[slug]", name: "Kategori", access: "Publik" },
  },
  {
    id: "profiles",
    label: "Profil anggota",
    description: "Halaman profil publik pengguna.",
    appTypes: ["content"],
    story: { role: "anggota", action: "punya halaman profil", benefit: "orang lain mengenal saya" },
    acceptance: [
      "KETIKA seseorang membuka /u/[username], SISTEM HARUS menampilkan nama, bio, dan tulisan terbit pengguna itu",
    ],
    edgeCases: "Pengguna nonaktif menampilkan 404.",
    entities: ["User"],
    route: { path: "/u/[username]", name: "Profil", access: "Publik" },
  },
  {
    id: "moderation",
    label: "Moderasi & laporan",
    description: "Pengguna melaporkan konten; moderator menindak.",
    appTypes: ["content"],
    story: { role: "moderator", action: "menindak laporan", benefit: "komunitas tetap aman" },
    acceptance: [
      "KETIKA pengguna melaporkan konten, SISTEM HARUS membuat laporan berstatus open",
      "KETIKA moderator menyembunyikan konten, SISTEM HARUS menutup laporan terkait dan mencatat moderatornya",
    ],
    edgeCases: "Satu pengguna hanya bisa melaporkan konten yang sama sekali.",
    entities: ["Report"],
    route: { path: "/admin/moderasi", name: "Moderasi", access: "Admin" },
  },
  {
    id: "reactions",
    label: "Suka & simpan",
    description: "Menyukai dan menyimpan tulisan.",
    appTypes: ["content"],
    story: { role: "pembaca", action: "menyimpan tulisan", benefit: "saya bisa membacanya nanti" },
    acceptance: [
      "KETIKA pengguna menekan Suka, SISTEM HARUS memperbarui jumlah suka tanpa memuat ulang halaman",
    ],
    edgeCases: "Menekan Suka dua kali membatalkan suka.",
    entities: ["Reaction", "Post"],
    route: { path: "/tersimpan", name: "Tersimpan", access: "Login" },
  },
  // Booking
  {
    id: "services",
    label: "Daftar layanan",
    description: "Layanan beserta durasi dan harga.",
    appTypes: ["booking"],
    core: true,
    story: {
      role: "pelanggan",
      action: "melihat layanan dan harganya",
      benefit: "saya tahu apa yang bisa dipesan",
    },
    acceptance: [
      "KETIKA pelanggan membuka /layanan, SISTEM HARUS menampilkan layanan aktif dengan durasi dan harga",
      "KETIKA admin menonaktifkan layanan, SISTEM HARUS menyembunyikannya dari pemesanan baru",
    ],
    edgeCases: "Reservasi lama untuk layanan nonaktif tetap berlaku.",
    entities: ["Service"],
    route: { path: "/layanan", name: "Layanan", access: "Publik" },
  },
  {
    id: "availability",
    label: "Jadwal & ketersediaan",
    description: "Jam operasional dan slot kosong.",
    appTypes: ["booking"],
    core: true,
    story: {
      role: "pelanggan",
      action: "melihat slot yang masih kosong",
      benefit: "saya bisa memilih waktu yang cocok",
    },
    acceptance: [
      "KETIKA pelanggan memilih tanggal, SISTEM HARUS menampilkan slot kosong sesuai jam operasional dan durasi layanan",
      "SISTEM HARUS menyembunyikan slot yang sudah lewat atau bertumpuk dengan reservasi confirmed",
    ],
    edgeCases: "Hari libur (tanpa jadwal) menampilkan pesan tidak ada slot.",
    entities: ["Availability", "Booking"],
    route: { path: "/pesan/[layanan]", name: "Pilih jadwal", access: "Publik" },
  },
  {
    id: "booking",
    label: "Formulir reservasi",
    description: "Pelanggan memesan slot.",
    appTypes: ["booking"],
    core: true,
    story: { role: "pelanggan", action: "memesan slot", benefit: "jadwal saya terjamin" },
    acceptance: [
      "KETIKA pelanggan mengirim reservasi valid, SISTEM HARUS membuat reservasi berstatus pending dan menampilkan kode reservasi",
      "JIKA slot sudah diambil orang lain saat dikirim, MAKA SISTEM HARUS menolak dan menampilkan slot alternatif",
      "JIKA nomor HP tidak valid, MAKA SISTEM HARUS menampilkan error di field nomor HP",
    ],
    edgeCases:
      "Dua pelanggan memesan slot sama bersamaan: hanya satu yang berhasil (cek di transaksi database).",
    entities: ["Booking", "Service"],
    route: { path: "/pesan/[layanan]", name: "Pilih jadwal", access: "Publik" },
  },
  {
    id: "booking_admin",
    label: "Kelola reservasi (admin)",
    description: "Konfirmasi, batalkan, tandai selesai.",
    appTypes: ["booking"],
    core: true,
    story: { role: "admin", action: "mengelola reservasi", benefit: "jadwal tertata" },
    acceptance: [
      "KETIKA admin membuka /admin/reservasi, SISTEM HARUS menampilkan reservasi per hari dalam tampilan kalender/daftar",
      "KETIKA admin mengonfirmasi atau membatalkan, SISTEM HARUS memberi tahu pelanggan",
    ],
    edgeCases: "Pembatalan kurang dari 2 jam sebelum jadwal ditandai terlambat.",
    entities: ["Booking"],
    route: { path: "/admin/reservasi", name: "Reservasi", access: "Admin" },
  },
  {
    id: "reminders",
    label: "Pengingat jadwal",
    description: "Pengingat otomatis sebelum jadwal.",
    appTypes: ["booking"],
    story: { role: "pelanggan", action: "menerima pengingat", benefit: "saya tidak lupa jadwal" },
    acceptance: ["SISTEM HARUS mengirim pengingat 24 jam sebelum reservasi confirmed"],
    edgeCases: "Reservasi yang dibuat < 24 jam sebelum jadwal mendapat pengingat langsung.",
    entities: ["Booking"],
    route: { path: "/admin/reservasi", name: "Reservasi", access: "Admin" },
  },
  {
    id: "booking_payment",
    label: "Bayar di muka (DP)",
    description: "Pembayaran online saat reservasi.",
    appTypes: ["booking"],
    transactional: true,
    story: {
      role: "pelanggan",
      action: "membayar DP",
      benefit: "reservasi saya langsung terkonfirmasi",
    },
    acceptance: [
      "KETIKA pembayaran DP berhasil, SISTEM HARUS mengubah reservasi menjadi confirmed",
      "JIKA DP tidak dibayar dalam 30 menit, MAKA SISTEM HARUS membatalkan reservasi dan membuka slotnya",
    ],
    edgeCases: "Webhook ganda diproses sekali.",
    entities: ["Booking"],
    route: { path: "/pesan/[layanan]", name: "Pilih jadwal", access: "Publik" },
  },
  // Tool
  {
    id: "tool_core",
    label: "Fungsi utama alat",
    description: "Input → proses → hasil (inti alat).",
    appTypes: ["tool"],
    core: true,
    story: {
      role: "pengguna",
      action: "memasukkan input dan mendapat hasil",
      benefit: "masalah saya selesai cepat",
    },
    acceptance: [
      "KETIKA pengguna mengirim input valid, SISTEM HARUS menampilkan hasil ≤ 2 detik",
      "JIKA input tidak valid, MAKA SISTEM HARUS menjelaskan apa yang salah tanpa menghapus input",
      "SELAMA proses berjalan, SISTEM HARUS menampilkan indikator memuat dan menonaktifkan tombol kirim",
    ],
    edgeCases: "Input sangat besar ditolak dengan batas ukuran yang disebutkan.",
    entities: ["ToolRun"],
    route: { path: "/", name: "Alat", access: "Publik" },
  },
  {
    id: "history",
    label: "Riwayat pemakaian",
    description: "Daftar input/hasil sebelumnya.",
    appTypes: ["tool"],
    story: {
      role: "pengguna",
      action: "melihat hasil sebelumnya",
      benefit: "tidak perlu mengulang",
    },
    acceptance: [
      "KETIKA pengguna membuka /riwayat, SISTEM HARUS menampilkan 20 riwayat terakhir miliknya",
    ],
    edgeCases: "Riwayat bisa dihapus satu per satu.",
    entities: ["ToolRun"],
    route: { path: "/riwayat", name: "Riwayat", access: "Login" },
  },
  {
    id: "export_result",
    label: "Unduh hasil",
    description: "Hasil bisa diunduh (PDF/PNG/CSV).",
    appTypes: ["tool"],
    story: {
      role: "pengguna",
      action: "mengunduh hasil",
      benefit: "saya bisa memakainya di tempat lain",
    },
    acceptance: [
      "KETIKA pengguna menekan Unduh, SISTEM HARUS mengunduh hasil dengan nama file yang menyertakan tanggal",
    ],
    edgeCases: "Tombol unduh nonaktif sebelum ada hasil.",
    entities: ["ToolRun"],
    route: { path: "/", name: "Alat", access: "Publik" },
  },
  {
    id: "share",
    label: "Bagikan lewat tautan",
    description: "Tautan publik ke hasil.",
    appTypes: ["tool"],
    story: { role: "pengguna", action: "membagikan hasil", benefit: "orang lain bisa melihatnya" },
    acceptance: [
      "KETIKA pengguna menekan Bagikan, SISTEM HARUS membuat tautan acak dan menyalinnya ke clipboard",
      "JIKA tautan kedaluwarsa, MAKA SISTEM HARUS menampilkan halaman tautan tidak berlaku",
    ],
    edgeCases: "Tautan bisa dicabut oleh pemiliknya.",
    entities: ["ShareLink", "ToolRun"],
    route: { path: "/s/[token]", name: "Hasil dibagikan", access: "Publik" },
  },
  // Fitur pendukung (FEA-04)
  {
    id: "search",
    label: "Pencarian",
    description: "Kotak pencarian teks pada daftar utama.",
    appTypes: [],
    story: {
      role: "pengguna",
      action: "mencari dengan kata kunci",
      benefit: "saya cepat menemukan yang dicari",
    },
    acceptance: [
      "KETIKA pengguna mengetik minimal 2 karakter, SISTEM HARUS menampilkan hasil setelah jeda 300 ms",
      "JIKA tidak ada hasil, MAKA SISTEM HARUS menampilkan status kosong dengan saran",
    ],
    edgeCases: "Pencarian tidak peka huruf besar/kecil.",
    entities: [],
    route: { path: "/cari", name: "Pencarian", access: "Publik" },
  },
  {
    id: "filter",
    label: "Filter & sortir",
    description: "Filter dan urutan pada daftar utama.",
    appTypes: [],
    story: {
      role: "pengguna",
      action: "menyaring dan mengurutkan daftar",
      benefit: "saya fokus pada yang relevan",
    },
    acceptance: [
      "KETIKA pengguna mengubah filter, SISTEM HARUS menyimpan filter di URL sehingga bisa dibagikan",
    ],
    edgeCases: "Filter yang tidak valid di URL diabaikan.",
    entities: [],
    route: { path: "", name: "Halaman daftar terkait", access: "Publik" },
  },
  {
    id: "export_csv",
    label: "Ekspor CSV/Excel",
    description: "Mengunduh daftar data.",
    appTypes: [],
    story: {
      role: "admin",
      action: "mengekspor data",
      benefit: "saya bisa mengolahnya di spreadsheet",
    },
    acceptance: [
      "KETIKA admin menekan Ekspor, SISTEM HARUS mengunduh CSV UTF-8 sesuai filter yang aktif",
    ],
    edgeCases: "Ekspor > 10.000 baris diproses di latar belakang lalu dikirim lewat tautan.",
    entities: [],
    route: { path: "/admin", name: "Admin", access: "Admin" },
  },
  {
    id: "import",
    label: "Impor data",
    description: "Mengunggah CSV untuk menambah data massal.",
    appTypes: [],
    story: {
      role: "admin",
      action: "mengimpor data dari CSV",
      benefit: "tidak perlu input satu per satu",
    },
    acceptance: [
      "KETIKA admin mengunggah CSV, SISTEM HARUS menampilkan pratinjau dan jumlah baris valid/tidak valid sebelum menyimpan",
      "JIKA ada baris tidak valid, MAKA SISTEM HARUS menyimpan baris valid saja dan memberi daftar baris yang gagal",
    ],
    edgeCases: "File > 5 MB ditolak.",
    entities: [],
    route: { path: "/admin/impor", name: "Impor", access: "Admin" },
  },
  {
    id: "upload",
    label: "Upload file/gambar",
    description: "Unggah berkas ke penyimpanan objek.",
    appTypes: [],
    story: { role: "pengguna", action: "mengunggah gambar/berkas", benefit: "data saya lengkap" },
    acceptance: [
      "KETIKA pengguna mengunggah berkas yang diizinkan, SISTEM HARUS menyimpannya dan menampilkan pratinjau",
      "JIKA berkas > 5 MB atau tipenya tidak diizinkan, MAKA SISTEM HARUS menolak sebelum mengunggah",
    ],
    edgeCases: "Nama berkas asli tidak dipakai sebagai kunci penyimpanan.",
    entities: ["FileAsset"],
    route: { path: "", name: "Formulir terkait", access: "Login" },
  },
  {
    id: "inapp_notif",
    label: "Notifikasi dalam aplikasi",
    description: "Ikon lonceng dengan daftar pemberitahuan.",
    appTypes: [],
    story: {
      role: "pengguna",
      action: "melihat pemberitahuan",
      benefit: "saya tidak melewatkan hal penting",
    },
    acceptance: [
      "KETIKA ada notifikasi baru, SISTEM HARUS menampilkan jumlah belum dibaca di ikon lonceng",
      "KETIKA pengguna membuka notifikasi, SISTEM HARUS menandainya terbaca",
    ],
    edgeCases: "Notifikasi lebih dari 90 hari dihapus otomatis.",
    entities: ["Notification"],
    route: { path: "/notifikasi", name: "Notifikasi", access: "Login" },
  },
  {
    id: "audit_log",
    label: "Log aktivitas (audit trail)",
    description: "Catatan perubahan data penting.",
    appTypes: [],
    story: {
      role: "admin",
      action: "melihat siapa mengubah apa",
      benefit: "kesalahan bisa ditelusuri",
    },
    acceptance: [
      "KETIKA data penting dibuat/diubah/dihapus, SISTEM HARUS mencatat pelaku, aksi, target, dan perubahan",
      "SISTEM HARUS menolak perubahan atau penghapusan baris log",
    ],
    edgeCases: "Log tetap tercatat walau pelaku kemudian dinonaktifkan.",
    entities: ["AuditLog"],
    route: { path: "/admin/log", name: "Log aktivitas", access: "Admin" },
  },
  {
    id: "stats_dashboard",
    label: "Dashboard statistik",
    description: "Grafik dan angka ringkasan untuk admin.",
    appTypes: [],
    story: { role: "admin", action: "melihat statistik", benefit: "saya memantau perkembangan" },
    acceptance: [
      "KETIKA admin membuka /admin/statistik, SISTEM HARUS menampilkan angka 7 dan 30 hari terakhir",
    ],
    edgeCases: "Data kosong menampilkan nol, bukan error.",
    entities: [],
    route: { path: "/admin/statistik", name: "Statistik", access: "Admin" },
  },
];

export const FEATURE_BY_ID: Record<string, FeatureDef> = Object.fromEntries(
  FEATURES.map((f) => [f.id, f]),
);

export const featuresForApp = (appType: string | undefined): FeatureDef[] =>
  FEATURES.filter((f) => appType !== undefined && f.appTypes.includes(appType as AppType));

export const SUPPORT_FEATURES: FeatureDef[] = FEATURES.filter((f) => f.appTypes.length === 0);
