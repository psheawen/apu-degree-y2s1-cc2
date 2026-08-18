
CREATE POLICY "Organizers read pronunciation audio" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pronunciation-audio' AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers upload pronunciation audio" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pronunciation-audio' AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers update pronunciation audio" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'pronunciation-audio' AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers delete pronunciation audio" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'pronunciation-audio' AND public.has_role(auth.uid(), 'organizer'));
