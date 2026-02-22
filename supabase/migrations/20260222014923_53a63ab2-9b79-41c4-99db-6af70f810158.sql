
-- Add foreign key from tasks.assignee_id to profiles.user_id
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_assignee_id_profiles_fkey
FOREIGN KEY (assignee_id) REFERENCES public.profiles(user_id);

-- Add foreign key from comments.user_id to profiles.user_id
ALTER TABLE public.comments
ADD CONSTRAINT comments_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Add foreign key from activity_log.user_id to profiles.user_id
ALTER TABLE public.activity_log
ADD CONSTRAINT activity_log_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Add foreign key from organization_members.user_id to profiles.user_id
ALTER TABLE public.organization_members
ADD CONSTRAINT organization_members_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);
