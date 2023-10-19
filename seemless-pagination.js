// Function to dynamically load a script
function loadScript(url, callback) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    if (script.readyState) {  // For old versions of IE
        script.onreadystatechange = function () {
            if (script.readyState == "loaded" || script.readyState == "complete") {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  // Other browsers
        script.onload = function () {
            callback();
        };
    }
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

// Load jQuery Pjax library and execute the rest of the script
loadScript("https://cdnjs.cloudflare.com/ajax/libs/jquery.pjax/2.0.1/jquery.pjax.min.js", function () {
    // Create variables to hold the CSS selectors for the containers that will be updated during pagination
    var containerSelector1 = '#seamless-replace1';
    var containerSelector2 = '#seamless-replace2';
    var containerSelector3 = '#seamless-replace3';

    // Implement seamless pagination for the first pagination container
    $(document).pjax('#w-pagination-wrapper1 a', containerSelector1, {
        container: containerSelector1,
        fragment: containerSelector1,
        scrollTo: false,
        timeout: 2500,
    });

    // Implement seamless pagination for the second pagination container
    $(document).pjax('#w-pagination-wrapper2 a', containerSelector2, {
        container: containerSelector2,
        fragment: containerSelector2,
        scrollTo: false,
        timeout: 2500,
    });

    // Implement seamless pagination for the third pagination container
    $(document).pjax('#w-pagination-wrapper3 a', containerSelector3, {
        container: containerSelector3,
        fragment: containerSelector3,
        scrollTo: false,
        timeout: 2500,
    });

    // Uncomment the following code if you're using Webflow interactions.
    // It reinitializes interactions after a Pjax request is completed.
    /*
    $(document).on('pjax:end', function() {
        Webflow.require('ix2').init();
    });
    */
});)))
