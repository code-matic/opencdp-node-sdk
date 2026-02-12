---
sidebar_position: 4
---

# Bulk Operations Examples

Examples for processing large volumes of data.

## Bulk User Import

```typescript
async function bulkImportUsers(users: User[]) {
  const batchSize = 100;
  const batches = chunk(users, batchSize);
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      await Promise.all(
        batch.map(user =>
          client.identify(user.id, {
            email: user.email,
            name: user.name,
            created_at: user.createdAt.toISOString()
          })
        )
      );
      
      successCount += batch.length;
      console.log(`Batch ${i + 1}/${batches.length}: ${batch.length} users imported`);
    } catch (error) {
      errorCount += batch.length;
      console.error(`Batch ${i + 1} failed:`, error);
    }
    
    // Rate limiting
    await sleep(1000);
  }
  
  return { successCount, errorCount };
}
```

## Bulk Event Tracking

```typescript
async function trackBulkEvents(events: Event[]) {
  const batchSize = 50;
  
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(event =>
        client.track(event.userId, event.name, event.properties)
          .catch(err => console.error(`Failed to track event:`, err))
      )
    );
    
    console.log(`Tracked ${Math.min(i + batchSize, events.length)}/${events.length} events`);
  }
}
```

## Related

- [Best Practices](../guides/best-practices.md)

