<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\UserNotification
 */
class UserNotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing('actor');

        return [
            'id'            => $this->id,
            'type'          => $this->type,
            'kind'          => $this->kind,
            'action_key'    => $this->action_key,
            'severity'      => $this->severity ?: 'info',
            'audience'      => $this->audience ?: 'user',
            'privacy_scope' => $this->privacy_scope ?: 'private',
            'subject_type'  => $this->subject_type,
            'subject_id'    => $this->subject_id,
            'title'         => (string) $this->title,
            'message'       => $this->message,
            'link'          => $this->link,
            'data'          => $this->data ?: [],
            'actor'         => $this->actor ? [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
                'email' => $this->actor->email,
            ] : null,
            'read_at'       => optional($this->read_at)->toIso8601String(),
            'created_at'    => optional($this->created_at)->toIso8601String(),
            'is_unread'     => $this->read_at === null,
        ];
    }
}
