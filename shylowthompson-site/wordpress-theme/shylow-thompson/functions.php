<?php
// Title tag support (fixes missing browser tab title + SEO)
add_theme_support('title-tag');

function shylow_enqueue_assets() {
    wp_enqueue_style(
        'shylow-fonts',
        'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap',
        [],
        null
    );
    wp_enqueue_style('shylow-theme', get_stylesheet_uri(), ['shylow-fonts'], '1.2');

    // Pass AJAX URL + nonce to JS for contact form
    wp_add_inline_script('shylow-theme', '', 'before');
    wp_localize_script('jquery', 'shylowAjax', [
        'url'   => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('shylow_contact_nonce'),
    ]);
}
add_action('wp_enqueue_scripts', 'shylow_enqueue_assets');

// Strip unnecessary WordPress bloat
add_action('wp_enqueue_scripts', function () {
    wp_dequeue_style('wp-block-library');
    wp_dequeue_style('wp-block-library-theme');
    wp_dequeue_style('global-styles');
    wp_dequeue_style('classic-theme-styles');
}, 100);

remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'rsd_link');

add_filter('show_admin_bar', '__return_false');

// ── AJAX contact form handler ──────────────────────────────────────────────
add_action('wp_ajax_shylow_contact',        'shylow_handle_contact');
add_action('wp_ajax_nopriv_shylow_contact', 'shylow_handle_contact');

function shylow_handle_contact() {
    check_ajax_referer('shylow_contact_nonce', 'nonce');

    $name    = sanitize_text_field($_POST['contact_name']    ?? '');
    $email   = sanitize_email($_POST['contact_email']         ?? '');
    $company = sanitize_text_field($_POST['contact_company'] ?? '');
    $message = sanitize_textarea_field($_POST['contact_message'] ?? '');

    if ( ! $name || ! $email || ! $message ) {
        wp_send_json_error('Please fill in all required fields.');
    }

    $to      = 'admin@shylowthompson.com';
    $subject = "Website Inquiry from {$name}";
    $body    = "Name: {$name}\nEmail: {$email}\nCompany: {$company}\n\n{$message}";
    $headers = [
        "Reply-To: {$name} <{$email}>",
        'Content-Type: text/plain; charset=UTF-8',
    ];

    if ( wp_mail($to, $subject, $body, $headers) ) {
        wp_send_json_success("Message sent — I'll be in touch shortly.");
    } else {
        wp_send_json_error('Could not send. Please email admin@shylowthompson.com directly.');
    }
}
