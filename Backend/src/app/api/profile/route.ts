import { getProfile, mapProfile, PROFILE_COLUMNS, requireUser } from '@/lib/auth';
import { handler, HttpError, json, parseBody } from '@/lib/http';
import { profileUpdateSchema } from '@/lib/validation';

export const GET = handler(async () => {
  const { supabase, user } = await requireUser();
  const profile = await getProfile(supabase, user.id);
  if (!profile) throw new HttpError(404, 'Perfil no encontrado');
  return json({ profile });
});

export const PATCH = handler(async (request: Request) => {
  const { supabase, user } = await requireUser();
  const { fullName } = await parseBody(request, profileUpdateSchema);

  // RLS garantiza además que solo se pueda modificar la fila propia.
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)
    .select(PROFILE_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Perfil no encontrado');

  return json({ profile: mapProfile(data) });
});
