<?php

namespace App\Models;

/**
 * Backward-compatible model name for public contact/inquiry records.
 *
 * Older controllers and middleware in this codebase referred to PublicInquiry,
 * while the actual migration creates the `inquiries` table. Keeping this model
 * avoids class-not-found errors and lets existing route-model binding continue
 * to use the `{inquiry}` parameter safely.
 */
class PublicInquiry extends Inquiry
{
    protected $table = 'inquiries';
}
