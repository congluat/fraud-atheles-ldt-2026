/*
 * Quán ăn quanh đây: danh sách tuyển chọn (đã đối chiếu địa chỉ có số nhà, 10/2026).
 * rating/reviews = điểm Google Maps lúc tra cứu (null nếu chưa xác minh được).
 * km = ước lượng đường xe từ Villa 1 (32/23 Mai Anh Đào).
 */
(function () {
  const root = document.querySelector("[data-places]");
  if (!root) return;

  const ORIGIN = "32/23 Mai Anh Đào, Phường 8, Đà Lạt";
  const CATEGORIES = ["Ăn sáng", "Cơm & món nước", "Lẩu", "Nướng", "Ăn vặt & tráng miệng", "Cà phê"];

  const PLACES = [
    /* Gần villa · Phường 8 */
    { name: "Nhà hàng Song Châu", cat: "Cơm & món nước", near: true, km: 0.8, dishes: "Set cơm Việt, mẹt gà nướng cơm lam, lẩu gà lá é Phú Yên, cá tầm", address: "86 Mai Anh Đào, Phường 8, Đà Lạt", hours: "10:00 – 21:00", rating: 4.6, reviews: 263, note: "Đối diện Thung Lũng Tình Yêu, chuyên cơm đoàn — hợp cả nhóm 18 người." },
    { name: "Lẩu Dê Lâm Ký", cat: "Lẩu", near: true, km: 0.6, dishes: "Lẩu dê, dê các món", address: "2 Ngô Tất Tố, Phường 8, Đà Lạt", hours: "Mở 24/24", rating: 4.4, reviews: 165, note: "Rất gần villa, mở cả đêm — tiện lẩu khuya." },
    { name: "Bánh canh cá lóc Hoàng Tạ", cat: "Cơm & món nước", near: true, km: 1.2, dishes: "Bánh canh cá lóc", address: "106 Mai Anh Đào, Phường 8, Đà Lạt", hours: "06:00 – 17:00", rating: 4.8, reviews: 8, note: "Ngay trên Mai Anh Đào, đi bộ được; quán nhỏ." },
    { name: "Lẩu gà lá é Tao Ngộ · Phù Đổng Thiên Vương", cat: "Lẩu", near: true, km: 1.3, dishes: "Lẩu gà lá é, gà chấm muối tiêu chanh", address: "178 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "08:00 – 22:00", rating: null, reviews: null, note: "Chi nhánh gần villa của thương hiệu lẩu gà lá é nổi tiếng." },
    { name: "Cơm gia đình – Nem nướng Hiền Ty", cat: "Cơm & món nước", near: true, km: 1.4, dishes: "Cơm gia đình, nem nướng", address: "150 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "08:00 – 22:00", rating: 4.0, reviews: 396, note: "Cơm phần + nem nướng, tiện bữa trưa nhanh." },
    { name: "Tiệm Gà Túk Túk", cat: "Nướng", near: true, km: 1.5, dishes: "Gà nướng sốt tiêu xanh, gà nướng cơm lam, sườn nướng tảng, lẩu Thái", address: "Hẻm 45 Trần Khánh Dư, Phường 8, Đà Lạt", hours: "10:00 – 21:30", rating: null, reviews: null, note: "Sân vườn ~2000 m², sức chứa >200 khách; đặt bàn trước (0981 234 102)." },
    { name: "Hoàng Hôn 3000 – BBQ & Acoustic", cat: "Nướng", near: true, km: 1.5, dishes: "Bò nướng tảng, tôm càng nướng, mẹt gà, lẩu; nhạc acoustic", address: "37 Trần Đại Nghĩa, Phường 8, Đà Lạt", hours: "10:00 – 23:00", rating: 4.9, reviews: 878, note: "Không gian rộng, ngắm hoàng hôn, bãi xe lớn — hợp BBQ cả đoàn." },
    { name: "Tiệm cà phê Người Thương Ơi", cat: "Cà phê", near: true, km: 1.5, dishes: "Cà phê, trà thảo mộc, vườn hoa, view hoàng hôn", address: "Hẻm 18 Tô Hiệu, Phường 8, Đà Lạt", hours: "07:00 – 22:00", rating: 4.6, reviews: 777, note: "Quán trên đồi view thành phố, có bãi ô tô, ngồi được cả nhóm." },
    { name: "Dốc Đá Coffee", cat: "Cà phê", near: true, km: 1.5, dishes: "Cà phê đen, đồ uống giá rẻ", address: "98 Vạn Hạnh, Phường 8, Đà Lạt", hours: "06:00 – 22:00", rating: 4.4, reviews: 119, note: "Cà phê local, view dốc, yên tĩnh." },
    { name: "Phở Hà Nội 125", cat: "Ăn sáng", near: true, km: 1.7, dishes: "Phở tái, cơm chiên dưa bò", address: "125 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: null, rating: 4.7, reviews: 23, note: "Phở Bắc gia đình, bò tươi; đậu ô tô trước quán được." },
    { name: "Đôi Đũa", cat: "Cơm & món nước", near: true, km: 1.8, dishes: "Cơm niêu, cá kho tộ, canh chua, thịt kho; lẩu bò nhúng giấm", address: "96 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "10:00 – 14:30", rating: 4.8, reviews: 1246, note: "Nhà mái ngói xưa, rộng, có lầu — cơm nhà cho nhóm đông, nên đặt trước." },
    { name: "Bánh tráng nướng 70 Phù Đổng Thiên Vương", cat: "Ăn vặt & tráng miệng", near: true, km: 2.0, dishes: "Bánh tráng nướng", address: "70 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "09:00 – 23:30", rating: 4.8, reviews: 13, note: "Gần villa, mở khuya — mua mang về cho cả nhà." },
    { name: "Là Việt Coffee", cat: "Cà phê", near: true, km: 2.0, dishes: "Cà phê Arabica Đà Lạt, cà phê sữa dừa, cold brew", address: "200 Nguyễn Công Trứ, Phường 8, Đà Lạt", hours: "07:00 – 22:00", rating: 4.5, reviews: 3404, note: "Xưởng rang local, không gian nhà xưởng rất rộng." },
    { name: "Bún bò Ngọc Ánh", cat: "Ăn sáng", near: true, km: 2.2, dishes: "Bún bò Huế, cơm phần", address: "28 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "06:30 – 21:00", rating: 4.2, reviews: 327, note: "Bún bò quen của dân Phường 8; sáng cuối tuần có thể chờ." },
    { name: "Ngô Gia – Bánh canh cá lóc, miến lươn Huế", cat: "Cơm & món nước", near: true, km: 2.2, dishes: "Bánh canh cá lóc, miến lươn", address: "252 Xô Viết Nghệ Tĩnh, Phường 8, Đà Lạt", hours: "06:00 – 21:30", rating: 5.0, reviews: 168, note: "Nước dùng được khen nhiều, mở đến tối." },
    { name: "LẠC – Xiên nướng tự xoay", cat: "Nướng", near: true, km: 2.2, dishes: "Xiên nướng tự xoay, chấm tiêu và trứng muối", address: "36 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "11:00 – 23:30", rating: 4.9, reviews: 245, note: "Giá rẻ, vui cho nhóm trẻ; tối đông nên đến sớm." },
    { name: "Bò Né 68 – Bánh ướt lòng gà", cat: "Ăn sáng", near: true, km: 2.5, dishes: "Bò né, bánh ướt lòng gà đặc biệt, bánh mì", address: "39 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "05:30 – 21:00", rating: 4.8, reviews: 112, note: "Quán gia đình, phục vụ nhanh; nhóm 18 người nên chia 2–3 lượt." },
    { name: "Dalafood", cat: "Ăn sáng", near: true, km: 2.6, dishes: "Mì Quảng, bún bò, bún riêu", address: "88 Xô Viết Nghệ Tĩnh, Phường 8, Đà Lạt", hours: "06:00 – 14:00", rating: 4.5, reviews: 104, note: "Quán rộng, thoáng, có chỗ đậu ô tô." },
    { name: "Bánh mì xíu mại 21 / Bánh căn Cô Trang", cat: "Ăn sáng", near: true, km: 2.7, dishes: "Sáng: bánh mì xíu mại · Chiều: bánh căn, bánh canh", address: "21 Nguyễn Công Trứ, Phường 8, Đà Lạt", hours: "05:00 – 11:30 · 15:00 – 21:30", rating: null, reviews: null, note: "Cùng địa chỉ: sáng bán xíu mại, chiều bán bánh căn; 20–50k." },
    { name: "Quán 50 – Sữa đậu nành & Xắp xắp", cat: "Ăn vặt & tráng miệng", near: true, km: 2.7, dishes: "Sữa đậu nành, xắp xắp trộn đậu phộng nước cốt dừa", address: "50 Nguyễn Công Trứ, Phường 8, Đà Lạt", hours: null, rating: null, reviews: null, note: "Món xắp xắp lạ miệng, khó tìm nơi khác." },
    { name: "Sữa đậu nành Cô Phương", cat: "Ăn vặt & tráng miệng", near: true, km: 2.8, dishes: "Sữa đậu nành nóng, bánh tráng nướng, bánh tiêu", address: "211 Nguyễn Công Trứ, Phường 8, Đà Lạt", hours: "17:00 – 23:30", rating: null, reviews: null, note: "Quán sữa tối quen thuộc của Phường 8, 5–15k." },
    { name: "Nguyên Thảo – Bún bò, cơm, bún thịt nướng", cat: "Cơm & món nước", near: true, km: 2.8, dishes: "Bún bò, cơm, bún thịt nướng", address: "473 Nguyên Tử Lực, Phường 8, Đà Lạt", hours: null, rating: null, reviews: null, note: "Giá bình dân, rau ăn kèm thoải mái (review Foody)." },
    { name: "Phương Anh – Lò nướng lu", cat: "Nướng", near: true, km: 2.8, dishes: "Heo quay lu da giòn", address: "441 Nguyên Tử Lực, Phường 8, Đà Lạt", hours: null, rating: null, reviews: null, note: "Quán nhỏ trong hẻm; nhóm đông nên gọi đặt trước." },
    { name: "Tri Kỷ Quán – Lẩu bò & món bình dân", cat: "Lẩu", near: true, km: 2.8, dishes: "Lẩu bò, gà quay nguyên con, cơm chiên", address: "426 Nguyên Tử Lực, Phường 8, Đà Lạt", hours: "08:00 – 22:00", rating: null, reviews: null, note: "Quán nhậu bình dân; gà làm lâu nên đặt trước." },
    { name: "Ẩm thực Bazan (Cafe 4221)", cat: "Cơm & món nước", near: true, km: 0.3, dishes: "Mâm cơm Việt, cơm lam, gà chấm muối lá é, rau rừng", address: "204 Mai Anh Đào, Phường 8, Đà Lạt", hours: "10:00 – 23:00", rating: null, reviews: null, note: "Cơm nhà dọn thố, mẹt — sát villa, đi bộ được; gọi xác nhận trước." },
    { name: "Mưa Cafe", cat: "Cà phê", near: true, km: 0.3, dishes: "Cà phê, kem, sinh tố, nước ép", address: "207 Mai Anh Đào, Phường 8, Đà Lạt", hours: "07:00 – 21:00", rating: null, reviews: null, note: "~40 chỗ, ngắm cảnh, giá 15–35k." },
    { name: "Cút Kít – Buffet BBQ & Beer", cat: "Nướng", near: true, km: 0.4, dishes: "Buffet nướng 40–56 món, sườn tháp Thái, lẩu, bia craft", address: "222 Mai Anh Đào, Phường 8, Đà Lạt", hours: "17:00 – 22:00", rating: 4.9, reviews: null, note: "2 tầng rộng, vé ~197–275k; đặt bàn trước cho 18 người." },
    { name: "Cá Tầm Đồng Tâm · Mai Anh Đào", cat: "Lẩu", near: true, km: 0.5, dishes: "Lẩu cá tầm măng chua, gỏi cá tầm, cá tầm nướng", address: "222/22 Mai Anh Đào, Phường 8, Đà Lạt", hours: null, rating: 4.6, reviews: 52, note: "Đối diện Thung Lũng Tình Yêu, sân vườn hồ koi, đủ chỗ cả đoàn." },
    { name: "Cơm tấm Vũ Thị", cat: "Cơm & món nước", near: true, km: 0.5, dishes: "Cơm tấm sườn, bì, chả", address: "287 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "09:00 – 15:00", rating: 4.8, reviews: 30, note: "Quán thoáng, đậu xe dễ, giá bình dân." },
    { name: "Onion Coffee & Pastry", cat: "Cà phê", near: true, km: 0.5, dishes: "Cà phê, croissant 12 loại nhân", address: "278/2 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "07:00 – 21:00", rating: null, reviews: null, note: "View thung lũng & đồi thông, có bãi ô tô." },
    { name: "Lạch Nướng – Grill & Hotpot", cat: "Nướng", near: true, km: 0.7, dishes: "Đồ nướng, lẩu gà lá é, món Tây Nguyên", address: "238 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: null, rating: null, reviews: null, note: "Hợp nhóm bạn, chỗ để xe rộng; ĐT 0985 728 571." },
    { name: "Quán Ăn Chiêng", cat: "Nướng", near: true, km: 0.8, dishes: "Gà nướng cơm lam, heo mọi nướng, lẩu atiso, gỏi bò rau rừng", address: "232 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "10:00 – 22:30", rating: 4.7, reviews: null, note: "Ẩm thực núi rừng, sức chứa lớn cho đoàn, bãi xe rộng." },
    { name: "Bánh tráng nướng Cô Kiều", cat: "Ăn vặt & tráng miệng", near: true, km: 1.1, dishes: "Bánh tráng nướng, trứng nướng, bắp, khoai nướng", address: "178 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "16:00 – 22:00", rating: 4.4, reviews: 23, note: "Hàng vỉa hè giá local, mua mang về; mưa có thể nghỉ." },
    { name: "Đèn – Coffee Trong Vườn", cat: "Cà phê", near: true, km: 1.3, dishes: "Cà phê sân vườn", address: "301 Mai Anh Đào, Phường 8, Đà Lạt", hours: null, rating: null, reviews: null, note: "Cà phê vườn cùng trục Mai Anh Đào." },
    { name: "Bánh canh Dốc Đá", cat: "Cơm & món nước", near: true, km: 1.4, dishes: "Bánh canh chả cá, xương; bún bò", address: "175 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "07:00 – 19:00", rating: 4.3, reviews: 193, note: "~30 chỗ, giá rẻ, khách địa phương đông." },
    { name: "Chợ Phiên Quán", cat: "Cơm & món nước", near: true, km: 1.8, dishes: "Ẩm thực Tây Bắc, siêu mẹt gà nướng, xôi", address: "118 Vạn Hạnh, Phường 8, Đà Lạt", hours: "09:00 – 22:00", rating: null, reviews: null, note: "Mẹt lớn ăn chung, hợp nhóm đông; ĐT 076 635 5699." },
    { name: "Lẩu nướng Hồng Hạnh", cat: "Lẩu", near: true, km: 2.0, dishes: "Lẩu, đồ nướng", address: "85 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "16:00 – 23:00", rating: 5.0, reviews: 10, note: "Chỉ bán tối, cùng trục Phù Đổng Thiên Vương." },
    { name: "Quán Chay Về Nhà", cat: "Cơm & món nước", near: true, km: 2.0, dishes: "Cơm chay, mẹt “Ôm Rừng” nem thính chay cuốn rau rừng", address: "16/3 Trần Khánh Dư, Phường 8, Đà Lạt", hours: "08:00 – 20:30", rating: null, reviews: null, note: "Lựa chọn chay; món mẹt nên đặt trước." },
    { name: "Cơm tấm A Tùng", cat: "Cơm & món nước", near: true, km: 2.1, dishes: "Cơm tấm, cơm phần", address: "77 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "06:00 – 20:00", rating: null, reviews: null, note: "10–50k, mở cả ngày." },
    { name: "Cơm chay Thanh Tịnh", cat: "Cơm & món nước", near: true, km: 2.2, dishes: "Cơm chay", address: "32/1 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: "08:00 – 21:00", rating: null, reviews: null, note: "Cơm chay 20–25k, ~20 chỗ." },
    { name: "Lẩu bò bê thui xí quách Minh Hậu 3", cat: "Lẩu", near: true, km: 2.2, dishes: "Lẩu bò, bê thui, xí quách", address: "222 Nguyên Tử Lực, Phường 8, Đà Lạt", hours: "09:00 – 23:00", rating: 4.6, reviews: 13, note: "Lẩu bò bình dân, mở muộn — hợp bữa tối." },
    { name: "Phở – Lẩu 369", cat: "Cơm & món nước", near: true, km: 2.3, dishes: "Phở bò, xì quách, sườn bò hầm, lẩu", address: "61 Nguyên Tử Lực, Phường 8, Đà Lạt", hours: null, rating: 4.9, reviews: 36, note: "Quán rộng, đậu ô tô dễ, nước dùng thanh." },
    { name: "Phở Truyền Nhân", cat: "Ăn sáng", near: true, km: 2.3, dishes: "Phở gà", address: "120 Nguyên Tử Lực, Phường 8, Đà Lạt", hours: "05:00 – 15:00", rating: 5.0, reviews: 21, note: "Phở gà ~35k ngon rẻ; quán nhỏ, giờ đông phải chờ." },
    { name: "Ánh Đông – Chả ram bắp & nem nướng", cat: "Ăn vặt & tráng miệng", near: true, km: 2.3, dishes: "Chả ram bắp, nem nướng cuốn bánh tráng", address: "3 Phù Đổng Thiên Vương, Phường 8, Đà Lạt", hours: null, rating: 4.5, reviews: 11, note: "Món cuốn đặc trưng Đà Lạt, 35–45k; quán nhỏ." },
    { name: "Phở Uyên", cat: "Ăn sáng", near: true, km: 3.0, dishes: "Phở bò thập cẩm, trứng lòng đào, sữa chua", address: "167 Xô Viết Nghệ Tĩnh, Phường 8, Đà Lạt", hours: "06:30 – 16:00", rating: null, reviews: null, note: "Phở hơn 26 năm; quán nhỏ, cao điểm phải chờ." },
    { name: "Hana Mushroom Garden · CN2", cat: "Lẩu", near: true, km: 3.3, dishes: "Lẩu nấm dưỡng sinh, buffet rau, BBQ Hàn", address: "37 Nguyên Tử Lực, Phường 8, Đà Lạt", hours: null, rating: null, reviews: null, note: "Sân vườn hồ koi; buffet rau + lẩu nấm ~145k/khách." },
    { name: "Bún Nguyệt", cat: "Ăn sáng", near: true, km: 3.5, dishes: "Bún riêu cục riêu to", address: "2 Nguyên Tử Lực, Phường 8, Đà Lạt", hours: "05:00 – 13:00", rating: 5.0, reviews: 13, note: "Quán lâu năm của dân địa phương." },

    /* Trung tâm · đặc sản nổi tiếng */
    { name: "Lẩu cá tầm Tuyên 1", cat: "Lẩu", near: false, km: 3.0, dishes: "Lẩu cá tầm", address: "97 Thông Thiên Học, Phường 2, Đà Lạt", hours: "10:00 – 22:00", rating: 4.7, reviews: 895, note: "Cơ sở gốc — dự phòng khi Tuyên 2 kín bàn." },
    { name: "Lẩu cá tầm Tuyên 2", cat: "Lẩu", near: false, km: 3.3, dishes: "Lẩu cá tầm, cá tầm các món", address: "Lô 75 KQH Nguyễn Công Trứ, Phường 2, Đà Lạt", hours: "10:00 – 22:00", rating: 4.8, reviews: 1323, note: "Rất nhiều review, nước lẩu thanh, hợp nhóm đông." },
    { name: "Hana Mushroom · CN1", cat: "Lẩu", near: false, km: 3.0, dishes: "Lẩu nấm, buffet rau, BBQ Hàn", address: "99 Bùi Thị Xuân, Phường 2, Đà Lạt", hours: "10:00 – 22:00", rating: null, reviews: null, note: "Buffet rau + lẩu nấm ~145k/người, có menu đoàn." },
    { name: "Bánh mì xíu mại Sương", cat: "Ăn vặt & tráng miệng", near: false, km: 3.5, dishes: "Bánh mì xíu mại cay, xíu mại chén", address: "14 Ánh Sáng, Phường 1, Đà Lạt", hours: "16:00 – 21:00", rating: 4.7, reviews: 140, note: "Chỉ bán ~3 tiếng buổi chiều là hết; dặn không cay nếu cần." },
    { name: "Bánh mì xíu mại 79 Cô Trúc", cat: "Ăn sáng", near: false, km: 3.5, dishes: "Bánh mì xíu mại", address: "119C Nguyễn Văn Trỗi, Phường 2, Đà Lạt", hours: "05:00 – 20:00", rating: 4.6, reviews: 654, note: "Mở từ sáng sớm đến tối, gần dốc chùa Linh Sơn." },
    { name: "Bánh mì xíu mại Phúc Hân", cat: "Ăn sáng", near: false, km: 5.0, dishes: "Bánh mì xíu mại, xíu mại trứng", address: "34 Hoàng Diệu, Phường 5, Đà Lạt", hours: "06:00 – 19:30", rating: 4.2, reviews: 2961, note: "Xíu mại kinh điển trên Hoàng Diệu, nhiều review nhất khu." },
    { name: "Bánh căn Thy", cat: "Ăn sáng", near: false, km: 3.5, dishes: "Bánh căn trứng cút, trứng gà, xíu mại", address: "22 Tăng Bạt Hổ, Phường 1, Đà Lạt", hours: "06:00 – 13:00", rating: null, reviews: null, note: "Từ 1991, vẫn nướng lò than nên bánh giòn." },
    { name: "Bánh căn Cây Bơ", cat: "Ăn sáng", near: false, km: 3.5, dishes: "Bánh căn trứng cút lòng đào, xíu mại, yaourt phô mai", address: "56 Tăng Bạt Hổ, Phường 1, Đà Lạt", hours: "05:00 – 12:00", rating: 4.6, reviews: null, note: "Người địa phương hay ăn; để ý kẻo vào nhầm quán bên cạnh." },
    { name: "Bánh canh Xuân An", cat: "Ăn sáng", near: false, km: 4.0, dishes: "Bánh canh giò chả, bún bò, mì Quảng, sữa đậu nành", address: "15B Nhà Chung, Phường 3, Đà Lạt", hours: "07:30 – 20:00", rating: 4.2, reviews: 792, note: "Bánh canh bột lọc hơn 40 năm." },
    { name: "Mì hoành thánh xá xíu Nông Phố", cat: "Ăn sáng", near: false, km: 4.6, dishes: "Mì hoành thánh, xá xíu", address: "50A Quang Trung, Phường 9, Đà Lạt", hours: "06:30 – 12:00", rating: 4.6, reviews: 16, note: "Đổi vị sáng kiểu người Hoa, gần Ga Đà Lạt." },
    { name: "Bánh ướt lòng gà Hằng", cat: "Ăn sáng", near: false, km: 4.5, dishes: "Bánh ướt lòng gà, gỏi gà, cháo gà", address: "68 Phan Đình Phùng, Phường 2, Đà Lạt", hours: "07:00 – 21:00", rating: null, reviews: null, note: "Một trong những quán bánh ướt lòng gà nổi tiếng nhất; ít bàn." },
    { name: "Tiệm mì Tàu Cao", cat: "Cơm & món nước", near: false, km: 4.0, dishes: "Mì hoành thánh, hủ tiếu, mì khô xá xíu", address: "217 Phan Đình Phùng, Phường 2, Đà Lạt", hours: "06:00 – 19:00", rating: 4.2, reviews: 1335, note: "Tiệm mì người Hoa gốc Quảng Đông từ thập niên 1960." },
    { name: "Phở Hiếu", cat: "Cơm & món nước", near: false, km: 3.5, dishes: "Phở bò, bò kho, bánh mì bò kho", address: "103 Nguyễn Văn Trỗi, Phường 2, Đà Lạt", hours: "05:30 – 20:45", rating: 4.2, reviews: 1522, note: "Từ 1979, đã chuyển từ Tăng Bạt Hổ về đây." },
    { name: "Bún bò Bốc Khói", cat: "Cơm & món nước", near: false, km: 4.0, dishes: "Bún bò Huế", address: "29 Trần Phú, Đà Lạt", hours: "05:50 – 16:00", rating: 4.2, reviews: 1568, note: "Bún bò nhiều review nhất trung tâm, gần nhà thờ Con Gà." },
    { name: "Cơm tấm Mei", cat: "Cơm & món nước", near: false, km: 3.5, dishes: "Cơm tấm sườn bì chả", address: "5 Khu Hòa Bình, Phường 1, Đà Lạt", hours: "07:45 – 19:15", rating: null, reviews: null, note: "Cơm tấm bình dân nổi tiếng sau chợ Hòa Bình, 25–35k." },
    { name: "Cơm gà Hải Nam · Trần Phú", cat: "Cơm & món nước", near: false, km: 4.0, dishes: "Cơm gà Hải Nam, cơm xá xíu, miến gà", address: "21/2A Trần Phú, Phường 3, Đà Lạt", hours: "08:00 – 22:00", rating: null, reviews: null, note: "Kiểu Singapore, cách nhà thờ Con Gà ~400 m." },
    { name: "Tiệm cơm Đức Hoàng", cat: "Cơm & món nước", near: false, km: 4.5, dishes: "Cơm gia đình, món mặn, nước ép", address: "27 Quang Trung, Phường 9, Đà Lạt", hours: "06:00 – 19:00", rating: 4.1, reviews: 663, note: "Cơm nhà gọi theo mâm, gần Ga Đà Lạt." },
    { name: "Cơm chay Âu Lạc", cat: "Cơm & món nước", near: false, km: 3.5, dishes: "Cơm chay phần, món chay bình dân", address: "15 Phan Đình Phùng, Phường 1, Đà Lạt", hours: "06:00 – 20:00", rating: 4.3, reviews: 680, note: "Chay rẻ ngay trung tâm, 15–33k/phần." },
    { name: "Lẩu bò Phan Rang Quang Trung", cat: "Lẩu", near: false, km: 4.5, dishes: "Lẩu bò Phan Rang", address: "29 Quang Trung, Phường 9, Đà Lạt", hours: "10:00 – 22:00", rating: 4.0, reviews: 145, note: "Lẩu bò cho nhóm, kết hợp tham quan Ga Đà Lạt." },
    { name: "Lẩu bò Thanh Tâm", cat: "Lẩu", near: false, km: 4.5, dishes: "Lẩu bò Ba Toa, các món bò", address: "14 Nguyễn Thị Định, Phường 1, Đà Lạt", hours: "10:00 – 22:00", rating: 3.8, reviews: 582, note: "Gần 40 năm, 2 tầng, có chỗ đậu ô tô — hợp nhóm." },
    { name: "Quán Dìn – Lẩu bò Ba Toa", cat: "Lẩu", near: false, km: 5.0, dishes: "Lẩu bò Ba Toa, lẩu bắp bò, lẩu gà, món nướng", address: "8/1 Hoàng Diệu, Phường 5, Đà Lạt", hours: "10:00 – 22:00", rating: null, reviews: null, note: "Gần 100 chỗ, nhận khách đoàn — rất hợp 18 người." },
    { name: "Lẩu gà lá é Cao Phụng", cat: "Lẩu", near: false, km: 6.0, dishes: "Lẩu gà lá é kiểu Phú Yên", address: "10/2 KQH Hoàng Văn Thụ, Phường 4, Đà Lạt", hours: "08:00 – 23:00", rating: 4.9, reviews: 332, note: "Chủ người Phú Yên, nồi 80–200k." },
    { name: "Lẩu cá tầm Ngư Sơn", cat: "Lẩu", near: false, km: 4.0, dishes: "Lẩu cá tầm, cá tầm chiên sả ớt", address: "33/15/3 Phan Đình Phùng, Phường 1, Đà Lạt", hours: "10:00 – 22:00", rating: 4.3, reviews: 1265, note: "~10 món cá tầm, trong hẻm Phan Đình Phùng." },
    { name: "Lẩu cá tầm Hoàng Gia", cat: "Lẩu", near: false, km: 4.0, dishes: "Lẩu cá tầm, các món cá tầm", address: "42 Phạm Ngũ Lão, Đà Lạt", hours: "10:00 – 23:00", rating: 4.8, reviews: 921, note: "Nhà gỗ ấm cúng gần hồ Xuân Hương, chọn cá sống." },
    { name: "Ốc 33 · quán gốc", cat: "Nướng", near: false, km: 4.5, dishes: "Ốc bươu nhồi thịt, lẩu đuôi bò", address: "175 Hai Bà Trưng, Phường 6, Đà Lạt", hours: "10:00 – 22:00", rating: 4.1, reviews: 421, note: "Nhiều quán cùng tên 33 — số 175 là quán gốc." },
    { name: "Nướng ngói Cu Đức", cat: "Nướng", near: false, km: 4.0, dishes: "Nướng ngói bò, heo, hải sản; lẩu hải sản", address: "6A Nguyễn Lương Bằng, Phường 2, Đà Lạt", hours: "10:00 – 22:00", rating: null, reviews: null, note: "Tự nhận quán nướng ngói đầu tiên Đà Lạt, thường rất đông." },
    { name: "Bánh tráng nướng Cô Hương", cat: "Ăn vặt & tráng miệng", near: false, km: 3.5, dishes: "Bánh tráng nướng", address: "46 Nguyễn Văn Trỗi, Đà Lạt", hours: "16:00 – 23:00", rating: 4.6, reviews: 227, note: "Ăn vặt tối gần dãy kem bơ Nguyễn Văn Trỗi." },
    { name: "Bánh bèo Bà Hường", cat: "Ăn vặt & tráng miệng", near: false, km: 4.5, dishes: "Bánh bèo tôm thịt, bánh nậm, bột lọc", address: "402 Phan Đình Phùng, Phường 2, Đà Lạt", hours: "09:00 – 21:00", rating: 4.3, reviews: 1900, note: "Bánh bèo từ năm 1968." },
    { name: "Liễu – Bánh bèo, bánh nậm, bánh lọc", cat: "Ăn vặt & tráng miệng", near: false, km: 3.5, dishes: "Bánh bèo da heo, bánh nậm, bánh lọc", address: "6 Ấp Ánh Sáng, Phường 1, Đà Lạt", hours: "05:00 – 17:30", rating: null, reviews: null, note: "Bình dân ~15k/dĩa, ít chỗ ngồi." },
    { name: "Chè Hé", cat: "Ăn vặt & tráng miệng", near: false, km: 3.5, dishes: "Chè truyền thống các loại", address: "11A Ba Tháng Hai, Phường 1, Đà Lạt", hours: "15:00 – 21:00", rating: null, reviews: null, note: "Nhà 2 tầng không biển, cửa sắt mở hé, cạnh tiệm bánh Liên Hoa." },
    { name: "Chè Thái Bà Triệu", cat: "Ăn vặt & tráng miệng", near: false, km: 3.5, dishes: "Chè Thái, chè sầu", address: "15 Bà Triệu, Phường 1, Đà Lạt", hours: "10:00 – 22:00", rating: 4.0, reviews: 850, note: "Chè lâu năm gần hồ Xuân Hương, 10–30k." },
    { name: "Kem bơ Nari", cat: "Ăn vặt & tráng miệng", near: false, km: 3.5, dishes: "Kem bơ, chè đậu đỏ, bánh flan, yaourt phô mai", address: "74C Nguyễn Văn Trỗi, Phường 2, Đà Lạt", hours: "08:00 – 22:00", rating: 4.6, reviews: null, note: "Sát Thanh Thảo, thường ít phải xếp hàng hơn." },
    { name: "Tofu – Tàu hũ & sinh tố", cat: "Ăn vặt & tráng miệng", near: false, km: 3.5, dishes: "Tàu hũ nước đường gừng, bánh flan, sinh tố", address: "12 Nguyễn Văn Trỗi, Phường 1, Đà Lạt", hours: "07:00 – 22:00", rating: null, reviews: null, note: "Tàu hũ mềm, ít ngọt, gần chợ." },
    { name: "Cafe Nga (Bố Già)", cat: "Cà phê", near: false, km: 3.5, dishes: "Yaourt phô mai, yaourt dâu/mâm xôi, cà phê", address: "2A Nguyễn Chí Thanh, Phường 1, Đà Lạt", hours: "05:30 – 22:30", rating: 4.6, reviews: 328, note: "Hơn 20 năm, nổi tiếng nhất với yaourt phô mai." },
    { name: "The Married Beans", cat: "Cà phê", near: false, km: 3.5, dishes: "Cà phê đặc sản Đà Lạt, cà phê rang mang về", address: "06 Nguyễn Văn Trỗi, Phường 1, Đà Lạt", hours: "07:00 – 21:00", rating: 4.6, reviews: 748, note: "Showroom còn hoạt động (CN 44 Hùng Vương đã đóng)." },
    { name: "Tiệm cà phê trứng Cô Ba", cat: "Cà phê", near: false, km: 4.5, dishes: "Cà phê trứng, cacao trứng, cà phê muối", address: "105 Hai Bà Trưng, Phường 6, Đà Lạt", hours: "06:30 – 23:30", rating: null, reviews: null, note: "Từ thập niên 1990, dùng hạt Cầu Đất." },
    { name: "Cơm niêu Vị Quê", cat: "Cơm & món nước", near: false, km: 3.0, dishes: "Cơm niêu, các món kho, canh kiểu nhà", address: "35-37 Đinh Tiên Hoàng, Phường 2, Đà Lạt", hours: "10:00 – 22:00", rating: 4.8, reviews: 571, note: "Mặt tiền 2 căn, gọi trước để xếp bàn nhóm." },
    { name: "Lẩu chay Hằng Thiện", cat: "Lẩu", near: false, km: 3.0, dishes: "Lẩu chay, món chay", address: "265/4 Bùi Thị Xuân, Phường 2, Đà Lạt", hours: "08:00 – 22:00", rating: 4.9, reviews: 641, note: "Lựa chọn chay được khen nhiều, phần ăn đầy." },
    { name: "Chả ram bắp – Nem nướng Tân Long", cat: "Nướng", near: false, km: 3.0, dishes: "Nem nướng, chả ram bắp, tương đậu phộng", address: "290 Bùi Thị Xuân, Phường 2, Đà Lạt", hours: "11:00 – 21:00", rating: 4.5, reviews: 1276, placeId: "ChIJUTEP29kScTERwt4F9YxQVWI", note: "Nem nướng lâu năm dân địa phương thích; quán hẻm, khó ngồi đủ 18." },
    { name: "Quán cơm Linh", cat: "Cơm & món nước", near: false, km: 3.5, dishes: "Cơm nhà: thịt rang cháy cạnh, cá chiên, canh cua rau đay", address: "23 Sương Nguyệt Ánh, Phường 9, Đà Lạt", hours: "10:30 – 15:00", rating: 4.9, reviews: 964, note: "Cơm gia đình ra món nhanh; trưa thường chờ ~15 phút." },
    { name: "Bánh mì xíu mại 47 Hoàng Diệu (Ông Phú)", cat: "Ăn sáng", near: false, km: 5.5, dishes: "Bánh mì xíu mại, trứng ốp, pate, bò", address: "47 Hoàng Diệu, Phường 5, Đà Lạt", hours: "05:00 – 17:00", rating: 4.6, reviews: 858, note: "Mở lâu, nhiều topping — dự phòng khi đến muộn." },
    { name: "Bánh mì xíu mại Bé Linh", cat: "Ăn sáng", near: false, km: 5.5, dishes: "Bánh mì xíu mại, chả quế, da heo", address: "37 Hoàng Diệu, Phường 5, Đà Lạt", hours: "06:00 – 10:00", rating: 4.5, reviews: 304, note: "Xíu mại nổi tiếng nhất Đà Lạt; cơ sở 37 rộng hơn (còn điểm 26 Hoàng Diệu)." },
    { name: "Bánh căn Lệ", cat: "Ăn sáng", near: false, km: 4.5, dishes: "Bánh căn thập cẩm, hải sản, bò bằm; chén xíu mại", address: "27/44 Yersin, Phường 10, Đà Lạt", hours: "06:30 – 15:30", rating: 4.3, reviews: 1411, note: "Dân địa phương mê; hẻm nhỏ, nên đi bộ/xe máy vào." },
    { name: "Bánh căn Nhà Chung", cat: "Ăn sáng", near: false, km: 5.0, dishes: "Bánh căn trứng, trứng cút, bò; nước chấm xíu mại", address: "1 Nhà Chung, Phường 3, Đà Lạt", hours: "06:00 – 10:00 · 14:00 – 21:00", rating: null, reviews: null, note: "Bánh căn nổi tiếng nhất, gần nhà thờ Con Gà; giờ cao điểm rất đông." },
    { name: "Bánh ướt lòng gà Trang", cat: "Ăn sáng", near: false, km: 4.0, dishes: "Bánh ướt lòng gà, gà xé, trứng non", address: "15F Tăng Bạt Hổ, Phường 1, Đà Lạt", hours: "07:00 – 19:30", rating: null, reviews: null, note: "Nơi khai sinh bánh ướt lòng gà; CN2 rộng hơn ở 3B Ma Trang Sơn." },
    { name: "Bánh ướt lòng gà Liên", cat: "Ăn sáng", near: false, km: 4.0, dishes: "Bánh ướt lòng gà, gà ta xé", address: "44 Tăng Bạt Hổ, Phường 1, Đà Lạt", hours: "06:30 – 21:30", rating: 4.4, reviews: 897, note: "Cùng dốc với Trang, mở cả ngày." },
    { name: "Quán Long – Bánh ướt lòng gà", cat: "Ăn sáng", near: false, km: 4.0, dishes: "Bánh ướt lòng gà: tim, gan, mề, trứng non", address: "202/2/5 Phan Đình Phùng (Lô A16 KQH), Phường 2, Đà Lạt", hours: "07:00 – 18:00", rating: null, reviews: null, note: "Bình dân, sâu trong hẻm, không biển lớn — dùng bản đồ." },
    { name: "Bún bò Anh Anh", cat: "Ăn sáng", near: false, km: 4.0, dishes: "Bún bò Huế, chả cá, sa tế nhà làm", address: "70B Phan Đình Phùng, Phường 2, Đà Lạt", hours: "06:30 – 13:00", rating: 4.4, reviews: 175, note: "Phần đầy đặn; quán nhỏ nên đi sớm." },
    { name: "Bún riêu Dì Cảnh", cat: "Ăn sáng", near: false, km: 4.5, dishes: "Bún riêu cua đồng, ớt nhà làm", address: "23/6 Bà Triệu, Phường 3, Đà Lạt", hours: "06:00 – 10:00", rating: null, reviews: null, note: "Bàn bày trong sân nhà rộng, có chỗ đỗ xe — hợp nhóm." },
    { name: "Bún riêu Cô Lan", cat: "Cơm & món nước", near: false, km: 4.0, dishes: "Bún riêu thêm xương, thêm riêu", address: "29 Nguyễn Văn Trỗi, Phường 2, Đà Lạt", hours: "14:00 – 20:00", rating: null, reviews: null, note: "Hơn 30 năm, chỉ bán chiều tối; quán nhỏ." },
    { name: "Mì Quảng Tuấn Thúy", cat: "Cơm & món nước", near: false, km: 4.0, dishes: "Mì Quảng gà, tôm thịt, bánh tráng mè", address: "132 Phan Đình Phùng, Phường 2, Đà Lạt", hours: "09:00 – 21:00", rating: null, reviews: null, note: "Lâu năm, mặt bằng rộng, phục vụ tốt đoàn 10–20 người." },
    { name: "Cơm niêu Như Ngọc", cat: "Cơm & món nước", near: false, km: 4.5, dishes: "Cơm niêu, ba chỉ cháy cạnh, cá kho tộ, canh chua", address: "1/18 Hồ Tùng Mậu, Phường 3, Đà Lạt", hours: "06:00 – 22:00", rating: 4.0, reviews: 2734, note: "Hơn 40 năm, >500 khách, có phòng riêng — đặt trước cho đoàn." },
    { name: "Gà nướng cơm lam Cô Sinh", cat: "Nướng", near: false, km: 5.0, dishes: "Gà nướng mắc mật, cơm lam, rau rừng xào tỏi", address: "86 Hùng Vương, Phường 9, Đà Lạt", hours: "08:30 – 20:00", rating: 4.5, reviews: 840, note: "Gà nướng than da giòn; trưa đông, nhóm lớn nên gọi trước." },
    { name: "Nem nướng Bà Hùng", cat: "Nướng", near: false, km: 4.0, dishes: "Nem nướng, bánh tráng chiên, tương gia truyền", address: "328 Phan Đình Phùng, Phường 2, Đà Lạt", hours: "11:00 – 21:00", rating: 3.8, reviews: 3208, note: "Thương hiệu lâu đời (1996), quán rộng; review khá trái chiều." },
    { name: "Nem nướng Dũng Lộc", cat: "Nướng", near: false, km: 6.5, dishes: "Nem nướng cuốn rau, tương đậu", address: "B29 KQH Hoàng Văn Thụ, Phường 4, Đà Lạt", hours: "11:00 – 21:00", rating: 4.5, reviews: 406, placeId: "ChIJQZXavzITcTER9YUDHL7F2Gs", note: "Người địa phương hay ăn, có tầng 2–3 cho nhóm." },
    { name: "Lẩu gà lá é 668", cat: "Lẩu", near: false, km: 5.5, dishes: "Lẩu gà lá é kiểu Phú Yên, gà nướng lu", address: "2B Chu Văn An, Phường 3, Đà Lạt", hours: "10:00 – 23:00", rating: 4.7, reviews: 1461, note: "Nhà gỗ có khu ngoài trời; 18 người gọi 3–4 nồi, tránh 19–20h." },
    { name: "Lẩu gà lá é Tao Ngộ · 3 Tháng 4", cat: "Lẩu", near: false, km: 6.0, dishes: "Lẩu gà lá é, gà ta", address: "5B đường 3 Tháng 4, Phường 3, Đà Lạt", hours: "08:00 – 22:00", rating: 3.4, reviews: 175, note: "Được cho là quán gốc; nhiều quán trùng tên, gọi 0977 144 238 đặt bàn." },
    { name: "Lẩu bò Ba Toa Quán Gỗ", cat: "Lẩu", near: false, km: 6.0, dishes: "Lẩu bò gân, nạm, đuôi; chao sa tế", address: "1/29 Hoàng Diệu, Phường 6, Đà Lạt", hours: "10:00 – 21:00", rating: 3.8, reviews: 1277, note: "Quán gốc >30 năm, nhà gỗ cuối hẻm (chỉ vừa xe máy), đông và ồn." },
    { name: "Lẩu bò Balu", cat: "Lẩu", near: false, km: 5.5, dishes: "Lẩu bò nước dùng đậm đà", address: "104 Hoàng Hoa Thám, Phường 10, Đà Lạt", hours: "11:00 – 22:00", rating: 4.8, reviews: 483, note: "Điểm cao, đường yên tĩnh, dễ chịu hơn hẻm Ba Toa." },
    { name: "Bánh tráng nướng Dì Đinh", cat: "Ăn vặt & tráng miệng", near: false, km: 5.5, dishes: "Bánh tráng nướng thập cẩm, trứng lòng đào, bánh tráng dẻo", address: "26 Hoàng Diệu, Phường 5, Đà Lạt", hours: "13:00 – 20:30", rating: 4.4, reviews: 2286, note: "Quán bánh tráng nướng đầu tiên Đà Lạt; ghé 14:30–15:30 đỡ chờ." },
    { name: "Kem bơ Thanh Thảo", cat: "Ăn vặt & tráng miệng", near: false, km: 4.0, dishes: "Kem bơ, kem trái cây, yaourt phô mai, chè Thái", address: "76 Nguyễn Văn Trỗi, Phường 2, Đà Lạt", hours: null, rating: null, reviews: null, note: "Kem bơ kinh điển, có lầu — hợp cả nhóm sau bữa tối." },
    { name: "Chè Như Ý", cat: "Ăn vặt & tráng miệng", near: false, km: 4.5, dishes: "Chè chuối nướng, chè Thái sầu riêng, chè nóng", address: "106 Ba Tháng Hai, Phường 1, Đà Lạt", hours: "15:30 – 22:00", rating: 4.4, reviews: 327, note: "Chè nóng giá rẻ, mời trà gừng; quán nhỏ phải ghép bàn." },
    { name: "Sữa đậu nành Hoa Sữa", cat: "Ăn vặt & tráng miệng", near: false, km: 4.0, dishes: "Sữa đậu nành nóng, bánh su kem, sừng trâu", address: "3F Tăng Bạt Hổ (64 cũ), Phường 1, Đà Lạt", hours: "06:00 – 23:30", rating: 4.2, reviews: 2141, note: "Từ 1980, gần chợ đêm, không gian rộng." },
    { name: "Cà phê Tùng", cat: "Cà phê", near: false, km: 4.0, dishes: "Cà phê phin, nhạc tiền chiến", address: "6 Khu Hòa Bình, Phường 1, Đà Lạt", hours: "07:00 – 21:30", rating: 4.4, reviews: 933, note: "Huyền thoại từ thập niên 1950; quán nhỏ, khó ngồi chung 18 người." },
    { name: "An Café", cat: "Cà phê", near: false, km: 4.5, dishes: "Cà phê muối, matcha, brunch", address: "63Bis Ba Tháng Hai, Phường 1, Đà Lạt", hours: "09:00 – 21:00", rating: 4.3, reviews: 5652, note: "Như khu vườn xanh, nhiều góc ngồi; chỉ nhận tiền mặt." },
  ];

  const lower = (s) => String(s || "").toLowerCase().normalize("NFC").replace(/\s+/g, " ").trim();
  const norm = (s) => lower(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  /* "banh can" không dấu sẽ khớp cả "bánh canh" → ưu tiên khớp nguyên từ; gõ có dấu thì so đúng dấu. */
  function matcher(raw) {
    const q = lower(raw);
    if (!q) return { strict: () => true, loose: () => true };
    if (q !== norm(q)) return { strict: (li) => li.dataset.text.includes(q), loose: () => false };
    const word = new RegExp(`(^|[^a-z0-9])${escape(q)}($|[^a-z0-9])`);
    return { strict: (li) => word.test(li.dataset.search), loose: (li) => li.dataset.search.includes(q) };
  }
  const enc = encodeURIComponent;

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function link(cls, text, href) {
    const a = el("a", cls, text);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    return a;
  }

  function mapsUrl(p) {
    const q = `https://www.google.com/maps/search/?api=1&query=${enc(`${p.name}, ${p.address}`)}`;
    return p.placeId ? `${q}&query_place_id=${p.placeId}` : q;
  }

  function directionsUrl(p) {
    const q = `https://www.google.com/maps/dir/?api=1&origin=${enc(ORIGIN)}&destination=${enc(`${p.name}, ${p.address}`)}`;
    return p.placeId ? `${q}&destination_place_id=${p.placeId}` : q;
  }

  function renderPlace(p) {
    const li = el("li", "place");
    const text = `${p.name} ${p.dishes} ${p.address} ${p.cat} ${p.note}`;
    li.dataset.text = lower(text);
    li.dataset.search = norm(text);
    li.dataset.near = p.near ? "1" : "0";
    li.dataset.cat = p.cat;

    const top = el("div", "place__top");
    top.append(el("strong", "place__name", p.name));
    if (p.rating) {
      const rate = el("span", "place__rating", `★ ${p.rating.toLocaleString("vi-VN")}`);
      if (p.reviews) rate.append(el("span", "place__reviews", ` (${p.reviews.toLocaleString("vi-VN")})`));
      rate.title = "Điểm Google Maps";
      top.append(rate);
    }
    li.append(top);

    li.append(el("span", "place__dishes", p.dishes));

    const meta = el("div", "place__meta");
    meta.append(el("span", `place__tag${p.near ? " place__tag--near" : ""}`, p.near ? "Gần villa" : "Trung tâm"));
    if (p.km) meta.append(el("span", "place__km", `~${p.km.toLocaleString("vi-VN")} km`));
    if (p.hours) meta.append(el("span", "place__hours", p.hours));
    li.append(meta);

    li.append(el("span", "place__addr", p.address));
    if (p.note) li.append(el("span", "place__note", p.note));

    const links = el("div", "place__links");
    links.append(link("place__link", "Google Maps ↗", mapsUrl(p)), link("place__link place__link--dir", "Chỉ đường từ villa ↗", directionsUrl(p)));
    li.append(links);
    return li;
  }

  const dialog = root.querySelector("[data-places-dialog]");
  const list = dialog.querySelector("[data-places-list]");
  const search = dialog.querySelector("[data-places-search]");
  const filterEl = dialog.querySelector("[data-places-filter]");
  const countEl = dialog.querySelector("[data-places-count]");
  const openBtn = root.querySelector("[data-places-open]");

  const sorted = [...PLACES].sort((a, b) => Number(b.near) - Number(a.near) || a.km - b.km);
  const sections = CATEGORIES.map((cat) => {
    const items = sorted.filter((p) => p.cat === cat);
    const section = el("section", "menu__group places__group");
    section.append(el("h4", "menu__group-title", cat));
    const ul = el("ul", "places__items");
    ul.append(...items.map(renderPlace));
    section.append(ul);
    return section;
  });
  const empty = el("p", "placeholder menu__empty", "Không có quán nào khớp.");
  empty.hidden = true;
  list.replaceChildren(...sections, empty);

  const FILTERS = [
    { id: "all", label: "Tất cả", test: () => true },
    { id: "near", label: "Gần villa", test: (li) => li.dataset.near === "1" },
    ...CATEGORIES.map((cat) => ({ id: cat, label: cat, test: (li) => li.dataset.cat === cat })),
  ];
  let active = FILTERS[0];

  const buttons = FILTERS.map((f) => {
    const btn = el("button", "mem-filter__btn", f.label);
    btn.type = "button";
    btn.setAttribute("aria-pressed", String(f === active));
    btn.addEventListener("click", () => {
      active = f;
      buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(FILTERS[i] === f)));
      apply();
    });
    return btn;
  });
  filterEl.replaceChildren(...buttons);

  function filter(test) {
    let total = 0;
    sections.forEach((section) => {
      let n = 0;
      section.querySelectorAll(".place").forEach((li) => {
        const match = active.test(li) && test(li);
        li.hidden = !match;
        if (match) n++;
      });
      section.hidden = n === 0;
      total += n;
    });
    return total;
  }

  function apply() {
    const m = matcher(search.value);
    const total = filter(m.strict) || filter(m.loose);
    empty.hidden = total > 0;
    countEl.textContent = `${total} / ${PLACES.length} quán`;
  }
  search.addEventListener("input", apply);
  apply();

  const nearCount = PLACES.filter((p) => p.near).length;
  root.querySelector("[data-places-summary]").textContent =
    `${PLACES.length} quán local đã chọn lọc · ${nearCount} quán quanh villa (Phường 8) · ${PLACES.length - nearCount} quán đặc sản ở trung tâm.`;

  openBtn.textContent = `Mở danh sách quán · ${PLACES.length}`;
  openBtn.hidden = false;
  openBtn.addEventListener("click", () => {
    dialog.showModal();
    search.focus();
  });
  dialog.querySelector("[data-places-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
})();
