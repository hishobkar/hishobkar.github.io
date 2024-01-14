// templatemo 467 easy profile

// PRELOADER

$(window).load(function () {
	$('.preloader').delay(1000).fadeOut("slow"); // set duration in brackets    
});



        // Check screen width on page load
        $(document).ready(function () {
            checkScreenWidth();

            // Check screen width on window resize
            $(window).resize(function () {
                checkScreenWidth();
            });
        });

        // Function to check screen width and apply class accordingly
        function checkScreenWidth() {
            var screenWidth = $(window).width();

            // Set a threshold width for mobile viewers, adjust as needed
            var thresholdWidth = 768;

            if (screenWidth < thresholdWidth) {
                // Apply class or make adjustments for mobile version
                // For example, you could add a class to the body element:
                // $('body').addClass('mobile-view');
            } else {
                // Remove the class or reset adjustments for desktop version
                // For example, remove the previously added class:
                // $('body').removeClass('mobile-view');
            }
        }


// HOME BACKGROUND SLIDESHOW
$(function () {
	jQuery(document).ready(function () {



// start - restrict mobile users to view mobile version of website

// Disable viewport meta tag for Bootstrap's responsiveness
// document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');

// Optionally, remove Bootstrap's responsive media queries
// const mqs = document.querySelectorAll('link[media]');
// mqs.forEach(mq => mq.remove());
// end - restrict mobile users to view mobile version of website




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