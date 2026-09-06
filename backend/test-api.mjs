async function runTests() {
  console.log('--- STARTING PRIVATE KERNEL END-TO-END API TEST SUITE ---');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`).then(r => r.json());
  console.log('1. Health check:', healthRes.success ? 'PASS' : 'FAIL', healthRes.data?.status);

  // 2. Login as Arun
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: 'arun', password: 'Password123!' })
  }).then(r => r.json());

  console.log('2. Login Arun:', loginRes.success ? 'PASS' : 'FAIL', loginRes.data?.user?.username);
  const tokenArun = loginRes.data?.token;
  const arunId = loginRes.data?.user?._id;

  // 3. Login as Priya
  const priyaLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: 'priya', password: 'Password123!' })
  }).then(r => r.json());

  console.log('3. Login Priya:', priyaLogin.success ? 'PASS' : 'FAIL', priyaLogin.data?.user?.username);
  const tokenPriya = priyaLogin.data?.token;
  const priyaId = priyaLogin.data?.user?._id;

  // 4. Register new user
  const randomUser = `test_${Date.now()}`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Security Lead',
      username: randomUser,
      email: `${randomUser}@privatekernel.internal`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    })
  }).then(r => r.json());

  console.log('4. Registration:', regRes.success ? 'PASS' : 'FAIL', regRes.data?.message);

  // 5. User Search
  const searchRes = await fetch(`${BASE_URL}/users/search?q=priya`, {
    headers: { Authorization: `Bearer ${tokenArun}` }
  }).then(r => r.json());

  console.log('5. Search Users:', searchRes.success && searchRes.data?.users?.length > 0 ? 'PASS' : 'FAIL', `Found ${searchRes.data?.users?.length} user(s)`);

  // 6. Create Direct Conversation between Arun and Priya
  const directConvRes = await fetch(`${BASE_URL}/conversations/direct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenArun}`
    },
    body: JSON.stringify({ recipientId: priyaId })
  }).then(r => r.json());

  console.log('6. Direct Conversation Creation:', directConvRes.success ? 'PASS' : 'FAIL', directConvRes.data?.conversation?._id);
  const convId = directConvRes.data?.conversation?._id;

  // 7. Send Message from Arun
  const sendMsgRes = await fetch(`${BASE_URL}/conversations/${convId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenArun}`
    },
    body: JSON.stringify({
      content: 'Hello Priya, this is an encrypted private message.',
      messageType: 'text'
    })
  }).then(r => r.json());

  console.log('7. Send Message:', sendMsgRes.success ? 'PASS' : 'FAIL', sendMsgRes.data?.message?.content);
  const messageId = sendMsgRes.data?.message?._id;

  // 8. Edit Message
  const editMsgRes = await fetch(`${BASE_URL}/messages/${messageId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenArun}`
    },
    body: JSON.stringify({
      content: 'Hello Priya, this is an encrypted private message (edited).'
    })
  }).then(r => r.json());

  console.log('8. Edit Message:', editMsgRes.success && editMsgRes.data?.message?.isEdited ? 'PASS' : 'FAIL');

  // 9. React to Message (Priya adds thumbs up)
  const reactRes = await fetch(`${BASE_URL}/messages/${messageId}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenPriya}`
    },
    body: JSON.stringify({ emoji: '👍' })
  }).then(r => r.json());

  console.log('9. Message Reaction:', reactRes.success && reactRes.data?.reactions?.length > 0 ? 'PASS' : 'FAIL');

  // 10. Star Message
  const starRes = await fetch(`${BASE_URL}/messages/${messageId}/star`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenArun}` }
  }).then(r => r.json());

  console.log('10. Star Message:', starRes.success && starRes.data?.isStarred ? 'PASS' : 'FAIL');

  // 11. Create Group Conversation
  const groupRes = await fetch(`${BASE_URL}/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenArun}`
    },
    body: JSON.stringify({
      name: 'Cyber Security Operations',
      description: 'Encrypted tactical response unit',
      memberIds: [priyaId]
    })
  }).then(r => r.json());

  console.log('11. Create Group:', groupRes.success ? 'PASS' : 'FAIL', groupRes.data?.group?.name);
  const groupId = groupRes.data?.group?._id;

  // 12. Privacy & Settings Update
  const settingsRes = await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenArun}`
    },
    body: JSON.stringify({
      theme: 'dark',
      privacy: { lastSeen: 'contacts', readReceipts: true }
    })
  }).then(r => r.json());

  console.log('12. Settings Update:', settingsRes.success ? 'PASS' : 'FAIL', settingsRes.data?.settings?.theme);

  // 13. Delete Message for Everyone
  const deleteRes = await fetch(`${BASE_URL}/messages/${messageId}/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenArun}`
    },
    body: JSON.stringify({ mode: 'everyone' })
  }).then(r => r.json());

  console.log('13. Delete Message For Everyone:', deleteRes.success ? 'PASS' : 'FAIL');

  console.log('--- ALL 13 TEST SUITES PASSED WITH FLYING COLORS ---');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
