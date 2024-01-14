// templatemo 467 easy profile

// PRELOADER

$(window).load(function () {
	$('.preloader').delay(1000).fadeOut("slow"); // set duration in brackets    
});

// HOME BACKGROUND SLIDESHOW
$(function () {
	jQuery(document).ready(function () {

		// // start - add libries dynamically
		// const libraries = [
		// 	// 'https://hishobkar.github.io/js/qrcode.min.js',
		// 	// 'https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs@gh-pages/qrcode.min.js',
		// 	// './js/library2.js',
		// 	// ... paths to the other libraries
		// ];

		// libraries.forEach(libraryPath => {
		// 	const script = document.createElement('script');
		// 	script.src = libraryPath;
		// 	document.head.appendChild(script);
		// });
		// // end - add libries dynamically

		$('body').backstretch([
			"images/tm-bg-slide-1.jpg",
			"images/tm-bg-slide-2.jpg",
			"images/tm-bg-slide-3.jpg"
		], { duration: 3200, fade: 1300 });

		var currentBlogPostLink = window.location.href;
		var options = { width: 80, height: 80 };

		var qrcode = new QRCode(document.getElementById("qrcode"), options);
		
		qrcode.makeCode(currentBlogPostLink);
	});
})