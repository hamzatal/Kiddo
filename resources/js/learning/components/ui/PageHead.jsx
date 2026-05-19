/**
 * PageHead — small wrapper around Inertia's <Head> that emits a
 * sensible default <meta name="description"> alongside the title.
 * Keeps SEO consistent without forcing every page to remember the
 * description meta tag.
 */

import React from "react";
import { Head } from "@inertiajs/react";

export default function PageHead({
    title,
    description,
    image = "/favicon.ico",
}) {
    return (
        <Head title={title}>
            {description && <meta name="description" content={description} />}
            <meta property="og:title" content={title} />
            {description && <meta property="og:description" content={description} />}
            <meta property="og:image" content={image} />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            {description && <meta name="twitter:description" content={description} />}
        </Head>
    );
}
