# Needs consideration:

### Buggy live preview behavior: JS context not reset correctly on reload
- https://github.com/sauerbraten/cms/commit/4236109be4984ee9ed256ac468f53e8186bb6784

- https://github.com/sauerbraten/cms/commit/807a26f4172caa1b40d9bbe774a45e452f8eba6b

> Needs consideration 🤔 How can we recreate the issue so we can evaluate your patch?

### Allow overriding ListedEntry resource

we override ListedEntry::columns() to inject a column that's not in the blueprints (so users can't toggle it off). Our listings get their entries from Elastic, and when saving a working copy, we inject certain fields into a special section of the Elastic document and let them override the 'live' values in the listing by loading that section into that column, then accessing "working copy" values from custom *Index fieldtypes.

https://github.com/sauerbraten/cms/commit/b82bd5d1b9a287966a60202b4a905865faf9c611

> Needs consideration 🤔

### Use correct blueprint for each entry in a RelationshipFieldtype response

When defining an Entries field and passing multiple collections, its listing/selector processes all entries' fields through the first collection's blueprint, instead of the one appropriate for each entry.

https://github.com/sauerbraten/cms/commit/61de309c259a8f42b4925d2bb627789dbb1361a8

> Needs consideration 🤔
 
### reference revision by ID, not date, when restoring

A revision's ID and date are probably the same thing for you, but they aren't for our custom RevisionsRepository

https://github.com/sauerbraten/cms/commit/bbc7fa53f4b15108cb3bd1907dfc800d7c705b01

> Needs consideration 🤔

### Default to mobile view in live preview (“mobile first” etc.)

https://github.com/sauerbraten/cms/commit/917c72e23e4bfe114c29ec0daf36c1be055f9d7b

> It's unclear from the code how this is working exactly — is it enforcing mobile first all the time? That would be a default behavior change and would be undesired for a lot of people. We could certainly add an option for default breakpoint though.

---
# Done:

### Replicator doesn't recognize popover position correctly when there are many options 
https://github.com/statamic/cms/issues/2966 (https://github.com/sauerbraten/cms/commit/a49ea3ee255543f3b0529c563e93839299c529d0)

### Blueprint tabs: narrower min-width
https://github.com/sauerbraten/cms/commit/07bbbdc6985aabe4844fe94216dddb5fa560f4d1

### Missing styles for links in tables in Bard
https://github.com/sauerbraten/cms/commit/7080b419624594f9c371f9f4b7435f3eaa7643f8

### Prettier word breaks in listings
https://github.com/sauerbraten/cms/commit/9ef6b633043999e6cbc9fa8a5ac3bfabe140e40e

### Enable Statamic Pro (not sure if we even have to do this as a core change?)
https://github.com/sauerbraten/cms/commit/be4780b5693745c7a261bfc9f3246ef5c77b30fe

### Bard: fixed toolbar
https://github.com/sauerbraten/cms/commit/23519e8293b0a103400439b74b8f615686767624

---
# Looks useful! Needs testing:

### Relationship Fieldtype: synchronization problems in an entry reopened in a stack
https://github.com/statamic/cms/issues/3026 (https://github.com/sauerbraten/cms/commit/9a652166727bc28a0b50e5c5e0d5d7d280ecdd02, https://github.com/sauerbraten/cms/commit/e0ef7f967ae018e34a78f735e997f5c4296a42ff)

### Bard-Fieldtype and TipTap: Enable/disable certain input/paste rules
https://github.com/statamic/ideas/issues/648 (https://github.com/sauerbraten/cms/commit/a6965e8b19fa98b14d2f5b63fe580c3f93b01902)

### Larger entry status dots
https://github.com/sauerbraten/cms/commit/c02c8eaf991168e4d2f6359af48aa4a754651d27

### Pass Revision History's indexUrl to Revision Preview so it works in a stack

Without this, you can't use the History/Restore feature on an entry opened in a stack already.

https://github.com/sauerbraten/cms/commit/40d483f04d23fb2207a1c6e67d7d0392b2ff2ccc

### Keep focal point '50-50-1' instead of resetting to null
When focal point is null, our systems use an automatically selected one. Without this change, it's impossible for a user to override the automatic one with 50-50-1 to get a centered crop.

https://github.com/sauerbraten/cms/commit/3d223f298ec7ca1d04f994d343e68dc046af2ded

### Set fallback iframe src attribute so live preview iframe doesn't load statamic

If something goes wrong with the preview iframe, browsers would have it load the parent location. we override this to show a loading spinner, because the next value update usually fixes the preview.

https://github.com/sauerbraten/cms/commit/a753cff9211275b6a7c1ca286b4598b0f7d9f7f4

### Properly shut down Echo on tab close/reload

When reloading an article's edit page with the dev tools open, you see Pusher reconnecting before the page reloads

https://github.com/sauerbraten/cms/commit/3eb8e3ef902e2a8b90cc957b308beb752fd09e60

---
# Will not be implemented:

### Scheduled (not yet public) entries: orange dot instead of grey
https://github.com/sauerbraten/cms/commit/7c648629c5ad049b28eac56c7077121df4e4ee80

> If/when we're we make a change here it would be to not rely on color at all, which is a general accessibility rule we neglected to follow.

### Hide Outpost license error dialog

https://github.com/sauerbraten/cms/commit/43fd02e5f6b7442a82103499a17cee7f67b2f3c5

> Not something we would bring into core – this is a workaround you'll probably need to keep around for a while. We've had discussions around a totally separate approach here though so it's likely not a permalninant thing!

---
# Needs consideration or feedback:

### Buggy live preview behavior: JS context not reset correctly on reload
- https://github.com/sauerbraten/cms/commit/4236109be4984ee9ed256ac468f53e8186bb6784

- https://github.com/sauerbraten/cms/commit/807a26f4172caa1b40d9bbe774a45e452f8eba6b

> Needs consideration 🤔 How can we recreate the issue so we can evaluate your patch?

### Allow overriding ListedEntry resource

we override ListedEntry::columns() to inject a column that's not in the blueprints (so users can't toggle it off). Our listings get their entries from Elastic, and when saving a working copy, we inject certain fields into a special section of the Elastic document and let them override the 'live' values in the listing by loading that section into that column, then accessing "working copy" values from custom *Index fieldtypes.

https://github.com/sauerbraten/cms/commit/b82bd5d1b9a287966a60202b4a905865faf9c611

> Needs consideration 🤔

### Use correct blueprint for each entry in a RelationshipFieldtype response

When defining an Entries field and passing multiple collections, its listing/selector processes all entries' fields through the first collection's blueprint, instead of the one appropriate for each entry.

https://github.com/sauerbraten/cms/commit/61de309c259a8f42b4925d2bb627789dbb1361a8

> Needs consideration 🤔
 
### reference revision by ID, not date, when restoring

A revision's ID and date are probably the same thing for you, but they aren't for our custom RevisionsRepository

https://github.com/sauerbraten/cms/commit/bbc7fa53f4b15108cb3bd1907dfc800d7c705b01

> Needs consideration 🤔

### Default to mobile view in live preview (“mobile first” etc.)

https://github.com/sauerbraten/cms/commit/917c72e23e4bfe114c29ec0daf36c1be055f9d7b

> It's unclear from the code how this is working exactly — is it enforcing mobile first all the time? That would be a default behavior change and would be undesired for a lot of people. We could certainly add an option for default breakpoint though.

---
# Other stuff

### Fix access into undefined in Replicator Set preview

https://github.com/sauerbraten/cms/commit/187563393ad46dcfaf81f64d58ba850d5a1e9f3a

> What is this fixing exactly? How can we recreate the issue so we can confirm the fix?

> Patch could be removed and was fixed in polygon statamic
https://git.spiegel.de/projects/STL/repos/polygon-provisioning/pull-requests/3135/commits/2d635381f872c55a7d20f1723df647011f5a5a04#client-data/statamic/core/resources/js/components/fieldtypes/replicator/Set.vue

---
Source File: https://gist.github.com/jackmcdade/bfe23b26440a1b786b58699b53e65b25
