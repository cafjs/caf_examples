<h1 id="aidtopacaf:activeco-designedcloudproxiesforeverybody"><a id="top"></a>CAF: Active, Co-designed Cloud Proxies for Everybody</h1>

<h4 id="antoniolainhplabspaloalto">Antonio Lain, HP Labs, Palo Alto</h4>

<p>We have seen a few examples of pairing a web app instance to an active, permanent cloud proxy to solve really difficult integration problems. A key requirement for those solutions is that the behavior of the proxy has to be co-designed with the client application. </p>

<p>This is what motivated our first requirement for CAF: the front-end app developer should also be able to implement the proxy. This is not common today, with separate front-end and back-end teams negotiating for weeks on low level Web APIs. </p>

<p>One reason this happens is that the skill set of a front-end developer is very different from a back-end guy. The average front-end developer will be comfortable with JavaScript and an event loop model similar to the one the browser provides, but is likely to find it very challenging to deal with concurrency or with distributed system failures. </p>

<p>To enable co-design we need to simplify the programming model.</p>

<p>We achieve that by restricting the scope of the model, even though too much simplification might end up disappointing experienced back-end developers. Yes, your app instance can only get one Cloud Assistant, and if you want to handle your own (node.js) events your way it will be painful. </p>

<p>Even if you prefer more choices than CAF currently offers, please do keep reading. If you do not end up using CAF we still hope that some of the ideas will inspire you when building your own (or helping us out). </p>

<h3 id="erlanglessons">Erlang Lessons</h3>

<p>Many mobile apps crash after a few minutes, so is it reasonable to expect the same
developer to write a proxy that should be up for years? We say the answer is both yes and no. We&#8217;ve taken a lesson from Erlang <a class="citation" href="#fn:1" title="Jump to citation">[1]<span class="citekey" style="display:none">Armstrong:2007</span></a>, which says crashing is a fact of life, and that we should detect failures asap, ensure no side effects, and deal with them at a different level. </p>

<p>For example, if you&#8217;ve done something that causes your CA to produce an error while processing a request and the internal state is messed up; no worries, after returning the error to the caller we automatically restore its state to the last one that was externally visible and ignore other uncommitted delayed outputs. Nobody else will notice!</p>

<p>What happens if an app has serious issues and keeps crashing?</p>

<p>Apps are kept separate, so a node.js process could host thousands of CAs that are all from the same app, while all app to app interactions use external interfaces. This means that we can take recovery actions at the platform-level without affecting other apps.</p>

<p>The CA&#8217;s long life implies that it will undergo numerous upgrades. We need to allow upgrades with minimal client disruption. Again, Erlang/OTP to the rescue. The CAF calls a &#8216;resume&#8217; framework method in each CA after an upgrade but before processing any more messages. This method provides a checkpoint of the state that contains versioning information, and this gives a chance to the CA to safely upgrade its internal state if code and checkpoint versions differ. Moreover, we package together the front-end and CA bits of
 your app (i.e., CAF is also a web server for your front-end) and that helps to
keep both consistent.</p>

<p>If you see a pattern here, it is not coincidental. Our first prototype of CAF was Erlang-based. But we quickly realized that the language would be an issue to front-end developers because they favor JavaScript. Node.js brings JavaScript to the
server side, but it provides very low level programming abstractions out of the box. We decided on the generic server behavior from Erlang/OTP as the basis of our CA, and evolved it to fit a node.js implementation. It has a been a bit of a journey from there as you will soon see&#8230; </p>

<h3 id="cost">Cost</h3>

<p>Nobody wants to pay for proxies. If hosting a CA costs only cents per year, that price can be included in the price of the app, or possibly hidden by other means. To keep the cost this low, a typical CA must be really light-weight. Think of a few kilobytes of state along with processing a simple message per second or less. All the heavy-lifting should be delegated to cloud services, leaving the CA as a simple state machine that mostly coordinates interactions and forwards messages. If you keep to these limits there is hope: even without any major efforts to optimize CAF, we can already host about 1K CAs with one Xeon core (or 250+ with a modern ARM core).</p>

<h3 id="scale">Scale</h3>

<p>The number of instances of browser-based web apps or devices in the Internet of Things could quickly exceed the billions of apps sold today through proprietary App Stores. Popular mobile apps easily exceed a hundred million users, so scaling a single app is also an issue. </p>

<p>As we mentioned above CAF multiplexes about 1K active CAs in one node.js process, and apps are kept separate from each other, meaning that they can be easily deployed in independent (or federated) platforms.</p>

<h4 id="scalingasingleapp">Scaling a single app</h4>

<p>Our Minimal Deployment Unit (MDU) for an app will host about a 100K CAs using a pair (i.e., master/slave) of Redis processes and a few hundred node.js processes. Redis is used for checkpointing private CA state. By partitioning CAs into MDUs we limit the number of connections per Redis process to a few hundred. However, we still have not solved the main problem, scaling CA to CA interactions across a few thousand MDUs. </p>

<p>It is likely that we will not be able to exploit much locality, and we will end up with a deadly all-to-all communication pattern. </p>

<p>What shall we do about it? Well, our approach is simple, if you cannot scale it, don&#8217;t do it. Don&#8217;t use point to point communication between CAs, use instead distributed sharing abstractions (see below) or services. </p>

<p>Isn&#8217;t that just shifting the problem to someone else? Sort of,
the hope is that by providing higher level information of the interactions needed it will be easier to exploit fancy hardware or a custom algorithm. We will give you an example when we introduce Sharing Actors.</p>

<h3 id="summary">Summary</h3>

<p>It should be clear by now that CAF is not a general-purpose framework.
We simplify abstractions to allow co-design, we rely on off-loading most of the work to cloud services to keep hosting costs down, and we discourage point-to-point interactions to scale. </p>

<p>So far we have mostly talked about things we don&#8217;t do. </p>

<p>Let&#8217;s talk about what we actually do. </p>

<ul>
<li>First, we argue why adding actors to node.js reduces programming complexity.</li>
<li>Second, we introduce persistent sessions by adding explicit output queues to an actor.</li>
<li>Third, we provide a novel data (and code!) sharing mechanism for actors that solves the &#8216;mostly-read by many&#8217; inefficiencies of a traditional Actor model without changing actor core semantics (aka Sharing Actors).</li>
<li>Fourth, we put these sharing abstractions to good use in CAF&#8217;s security model where they represent local name spaces that are linked and replicated.</li>
<li>Finally, in CAF both a CA and the framework itself are built from components, and we show how to customize those components using dependency injection.</li>
</ul>

<h2 id="aidactorsaactorsinjavascript"><a id="actors"></a>Actors in JavaScript</h2>

<p>At the beginning we naively thought that the event loop in node.js would be similar enough to the event loop in the browser so that front-end programmers could just feel at home. Replace UI events with messages and you are done. Right? Not quite. </p>

<h3 id="racesinjavascript">Races in JavaScript</h3>

<p>Races in JavaScript? JavaScript is single threaded, so why are we concerned?</p>

<p>Well, there are no data races in a shared-memory sense (two+ concurrent accesses to a memory location, one of them a write) but node.js uses an asynchronous execution model in which a task is implemented as a sequence of simpler asynchronous steps, and these steps could interleave with the steps of another task in an arbitrary manner. </p>

<p>Since all these steps could modify the same state, they could affect each other. For example, a step can break an invariant that another step in a different task depends on. </p>

<p>So we do have to worry about coarse-grained races.</p>

<h4 id="raceexample">Race example</h4>

<p>A file-based log service implements two tasks: <em>Append</em> and <em>Rotate</em>. <em>Append</em> has one asynchronous step that writes data to the log file. <em>Rotate</em> has two asynchronous steps: the first one (<em>Copy</em>) copies the file to another one with a new extension; the second one, (<em>Truncate</em>) truncates the log file to have zero size. When we execute an <em>Append</em> after a <em>Copy</em> but before a <em>Truncate</em> both tasks give no errors but the newly appended data is missing. </p>

<h4 id="front-endprogrammingandraces">Front-end programming and races</h4>

<p>Coarse-grained races are not as common while programming an application front-end. Typically, you will get a UI event, modify the DOM, and you are done. You do not tend to spawn a sequence of asynchronous steps to process a UI event.
And even when you do, e.g., while using AJAX calls, the user and the application logic tend to help you to serialize correctly those steps. </p>

<p>Front-end programmers need a higher level abstraction than node.js that transparently deals with coarse-grained races.</p>

<h4 id="firstattempttoeliminateraces">First attempt to eliminate races</h4>

<p>A simple solution is to add a task queue. As long as we let every task finish before dequeuing the next one, all the asynchronous steps in a task are serialized. In the previous example, an <em>Append</em> task will start before (or after) the <em>Rotate</em> task and their steps never interleave.</p>

<p>Unfortunately, using a single task queue can seriously degrade performance.
Assume that each CA has its own log and we want to support a large number of CAs with a single (node.js) process. Even though we could safely overlap a <em>Rotate</em> task in one CA and an <em>Append</em> one in a different CA they are unnecessarily serialized by the queue. Disks perform better with multiple outstanding IO requests and also, it is easier to minimize perceived latency by prioritizing short (but frequent) <em>Append</em> tasks.</p>

<h4 id="eliminatingraceswithactors">Eliminating races with actors</h4>

<p>We need more task queues, but tasks in different queues should not interfere with each other while operating independently.</p>

<p>One way to provide that guarantee is ensuring that tasks in different queues do not share state. In CAF each CA has its own task queue and some private state, with no access to global state. </p>

<p>Now, if you think of a message as a way to encapsulate a task, you can see that a CA is just a simple actor (in the Actor model sense <a class="citation" href="#fn:2" title="Jump to citation">[2]<span class="citekey" style="display:none">Agha:1985</span></a>), that has a global name and some private state, serializes message processing from an input queue, and communicates asynchronously with the external world.</p>

<h3 id="errorrecoverywithactors">Error recovery with actors</h3>

<p>The second big difference between front-end and back-end programming is how to deal with application errors or system failures. The front-end has the luxury of having a human involved that kindly (or reluctantly) will take a meaningful recovery action (like flushing the phone down the toilet). Also, expectations are lower, and an application crash is tolerated, even with lost of your data, if it does not become part of your daily routine. </p>

<p>In contrast, the proxy in the cloud should be invisible to the end user; it just works, for years at a time, while gracefully recovering from hardware failures, botched code upgrades, or the occasional infrequent software bug. By giving a bit of stability to your app with a CA, it will also help the end user to make the right meaningful recovery action when the front-end crashes while minimizing data loss (and flushed phones).</p>

<p>It is difficult to transparently recover a task that involves multiple asynchronous steps from arbitrary failures. We are not claiming that CAF gets it right all the time, it just tries harder.</p>

<p>The CAF approach is based on two old ideas: </p>

<ul>
<li>keeping in a remote checkpointing service a snapshot of the CA&#8217;s state right after the last completed task</li>
<li>delaying unrecoverable (external) actions until the last minute and then committing them atomically using a local two-phase protocol (checkpointing also makes this commitment durable).</li>
</ul>

<p>When we get an error, or the underlying platform recovers from a hardware failure, we load the snapshot, update the CA state and redo all the committed actions (assumed idempotent).</p>

<h4 id="limitations">Limitations</h4>

<p>What if committed actions are not idempotent?</p>

<p>Transactional actions are implemented using a plug-in, and the assumption is that this plug-in knows how to make the action idempotent. For example, it could implement a reliable messaging transport that gives unique identifiers to messages and eliminates duplicates, or it could use a distributed transactional protocol like XA, or it could just check that an action has not been executed before retrying. </p>

<p>Note that the main reason for a local two-phase commit protocol is to orchestrate commit for multiple plugins, since a CA may have a task committing resources with very different requirements. </p>

<p>Our approach fails when progress of an intermediate asynchronous step requires an unrecoverable action. CAF does not put restrictions on your node.js code, and it is actually easy to end up in such a situation. </p>

<p>In many cases the root cause is that the scope of the task does not match its natural transaction boundaries, and promoting several steps to independent tasks fixes the problem. In other cases reordering steps helps. When all bets are off you will end up in the ugly world of compensating actions, possibly with the help of a plug-in.</p>

<p>All this sounds complicated, are we really simplifying the programming model?</p>

<p>We are shifting complexity from the CA writer to the plug-in writer. A transactional plug-in is, in most cases, written by a back-end expert, not by a front-end programmer.</p>

<p>As long as the CA writer manages CA state and external interactions with core CAF mechanisms or transactional plug-ins, he/she can ignore most of the previous discussion. The CA method abstraction, as described in <a href="gettingstarted.html">Getting Started</a>, adds an argument with a callback to notify the framework when to commit or abort the transaction. The expectation is that this callback is the last operation in the task, and also returns a response to the client. </p>

<h2 id="aidsessionsapersistentsessions"><a id="sessions"></a>Persistent Sessions</h2>

<h3 id="handlingnotifications">Handling notifications</h3>

<p>An autonomous CA can asynchronously notify the client application when certain condition occurs. Compared to CAs, the client is rarely on-line, and when is online it can access the CA from different devices, sometimes using multiple devices at the same time. </p>

<p>This raises the question of what to do with notifications. Delivery of notifications is best-effort, but is not acceptable for many applications to drop all of them whenever the client is not on-line. We need to buffer them in the cloud.</p>

<p>But we cannot just keep buffering notifications until we run out of memory, and it is not always clear what to do when we need to drop some of them. Shall we get rid of the oldest one? Can we remove duplicates? Can we just stop adding notifications until the client catches up? The right answer is very application-dependent.</p>

<p>Concurrent access to a CA from multiple devices raises similar issues. Shall we multicast the notification to all the devices? Is a first-come-first-served strategy acceptable? Can we target a particular device to receive certain types of notifications? Again, the right answer is very application-dependent. </p>

<h3 id="logicalsessions">Logical sessions</h3>

<p>We need a simple software abstraction to customize notification handling. In a coup of originality we call that abstraction a session. A CA can have multiple sessions, each identified by a name. To talk with a CA the client first establishes a session with it while providing the name of the session (or &#8216;default&#8217;). Similarly, when the CA wants to notify the client it also specifies the session name. </p>

<p>We introduce the concept of a logical session to represent all the sessions that use a given name and target the same CA. All the notifications in a logical session are randomly split across all the concurrent sessions with the same name. </p>

<p>This gives you the flexibility that you need: for example, pick a different session name for each device and decide which one to notify. We provide examples in <a href="gettingstarted.html">Getting Started</a>.</p>

<h3 id="outputqueues">Output queues</h3>

<p>A CA has an output notification queue for each logical session. The CA&#8217;s application code can obtain the name of the current session and change its behavior accordingly. Moreover, the contents of that queue are directly accessible to application code with a simple interface (see <a href="gettingstarted.html#logical">Getting Started</a>). </p>

<p>This gives to your code full control of notifications but there is a caveat. </p>

<p>As we mentioned a CA is an actor that serializes the processing of messages, which changes its internal state. We could have made output queues part of the internal state of a CA but in that case the client would not be able to dequeue a notification while the CA was busy processing a message. </p>

<p>Instead, output queues are logically separate entities (i.e., a different actor) and they asynchronously communicate with both the client and the CA. This means that dequeue operations by the client are concurrent with CA efforts to manage the queue. The queue management interface, as shown in <a href="gettingstarted.html#logical">Getting Started</a>), restricts operations to gracefully deal with those races.</p>

<h3 id="exactly-oncerequestprocessing">&#8216;Exactly-once&#8217; request processing</h3>

<p>We also use sessions to support &#8216;exactly-once&#8217; processing of client requests by a CA. </p>

<p>The core ideas are based on <a class="citation" href="#fn:3" title="Jump to citation">[3]<span class="citekey" style="display:none">Bernstein:1990</span></a>, that shows how a stateless client can achieve such property with the help of transactional queues. In their approach, stateless clients piggy-back information about its own state to requests, and this enables a safe recovery after client failure by examining the (transactional) queues that propagate requests (or responses). </p>

<p>Why is this useful? Imagine that you are trying to buy a toaster with your favorite app. You type your credit card number, click ok, and then the app crashes. You restart the app and there is no trace of your order anywhere in the system. Confidently, you repeat the process and this time it works. Congratulations, you got two toasters!</p>

<p>It is difficult to get that right. Aggressive caching of stale data, delayed updates to the database, a long queue to process payments, partially cancelled requests&#8230; What you see now is not what you are going to get.</p>

<p>A CA can help. It serializes the processing of client requests. It also has some reliable state that is transactionally updated with a request. And those requests are always part of a session, making it easier for a client to associate to a session part of its own state, which will be transactionally committed with the processing of a request. </p>

<p>The protocol is straightforward. As part of the request the client could add a memento that will be remembered by the CA (as part of its checkpointed state) if the request commits. This memento is associated with the logical session of the request, and replaces any previous memento in that logical session. </p>

<p>We also introduce explicit requests to start and close a session with a CA: the response to a start request is the last memento, and closing a session deletes the memento. This allows a client to detect an orphaned session, i.e., not properly closed due to a failure, when it starts a new one. It also ensures that the memento returned reflects its own state before the last properly committed request, and using that information it can accurately avoid re-issuing the same request (or missing one). </p>

<p>The CA will delay processing the request to start a new session until all previous requests have been committed (or aborted), giving an accurate picture of the state of the back-end. See the example <em>JustOnce</em> for details.</p>

<h4 id="assumptions">Assumptions</h4>

<p>There are some limitations. A stateless client can never remember whether it processed a response before crashing, therefore, the client can only guarantee &#8216;at-least-once&#8217; processing of responses. This is less of an issue in practice, humans are good at filtering duplicates, and, for example, are not likely to be surprised by seeing a confirmation page twice. </p>

<p>Also, clients should be well-behaved, restarting a session when a request timed out as opposed to just retry the request, ensuring a strict sequence of mementos per logical session, and using mementos that uniquely identify what they should do next. </p>

<h2 id="aidsharingasharingactors"><a id="sharing"></a>Sharing Actors</h2>

<h3 id="background">Background</h3>

<p>Actors have a fundamental weakness. Sharing mostly-read data across a large number of actors is inefficient and can cause problems when scaled. There have been two bad options available: </p>

<ul>
<li><p>Pick one actor, make the mostly-read data part of its internal state, and force the others to send messages to it when they want to access this data.</p></li>
<li><p>Replicate the data in all the actors, pick one actor to serialize updates and propagate them.</p></li>
</ul>

<p>Implementations that make use of the actor model generally combine the above two options in some way, and then reduce the time to propagate updates by assembling a hierarchy of actors. This solves some, but not all, problems. The first option adds unnecessary serialization and forces an expensive message processing step per read. Plus, to maintain task atomicity, reader actors delay any additional message processing while waiting for a read, which results in performance degradation. The second option also has some undesirable results because the number of update messages and the memory overhead grow linearly with the number of readers. </p>

<p>With our aggressive scaling goals, these approaches alone will not work well. So, we considered several alternatives.</p>

<p>Some actor frameworks, such as Erlang, provide a back-door to access shared memory. Actors in the same process can then use an unsafe data structure (ETS table) to avoid local replication and reduce the number of updates. However, once you start using it, many bugbears of shared-memory programming are back, including races while updating multiple keys or lack of failure isolation. Too high a price to pay for the performance benefit.</p>

<p>Erlang also has Mnesia, a distributed, in-memory data store that tames unsafe data structures (ETS tables) by providing strong consistency and a transactional interface. The problem with Mnesia is that strong consistency limits scalability. A writer is blocked by readers, and when you have readers spread across thousands of processes, the coordination effort becomes unmanageable.</p>

<h3 id="introducingsharingactors">Introducing Sharing Actors</h3>

<p>The idea behind Sharing Actors is to identify a useful data sharing pattern, provide an efficient implementation, and ensure that the implementation can be emulated with actors that just use messages and internal state. </p>

<p>Emulation preserves the semantics of actors, and, if you ignore performance differences, an external observer will not be able to tell whether we are using our fancy sharing implementation or just plain actor messages. This guarantees that the sharing implementation does not introduce any shared-memory bugbears. </p>

<p><strong>Are Sharing Actors too good to be true?</strong> </p>

<p>This only works for certain data sharing patterns. It turns out that mostly-read data (one writer/many readers) is one of them. Shared data is owned by one actor, which views this data as part of its internal state. When it processes a message, all the changes to shared data during that processing are captured in a single update. We call that the <strong>Atomicity</strong> property. The propagation of updates preserves update order but it does not block writers. The result is that we can scale but we can only provide weak consistency.</p>

<p>Reader actors also treat shared data as (read-only) internal state. Changes to that state respect message serialization in that atomic updates cannot be visible during message processing. Otherwise, it would be impossible to emulate updates with messages. We call that the <strong>Isolation</strong> property.</p>

<p>We also need to provide fairness to enable emulation. A reader actor cannot delay indefinitely another actor from seeing a locally available update. We call that the <strong>Fairness</strong> property.</p>

<p>It turns out that a single-writer sharing implementation that respects the three properties of <strong>Atomicity, Isolation,</strong> and <strong>Fairness</strong> as described, can be emulated. The proof by Mohsen Lesani (UCLA) was constructive, giving us a direct translation into actors that is useful for debugging implementations. </p>

<h3 id="implementingsharingactorsincaf">Implementing Sharing Actors in CAF</h3>

<p>Respecting both the <em>Isolation</em> and <em>Fairness</em> properties forces us to locally maintain multiple versions of the shared data. This is easier to do efficiently with a higher-level data abstraction, and we use a Map interface. Internally, we implement this Map with a persistent data structure <a class="citation" href="#fn:4" title="Jump to citation">[4]<span class="citekey" style="display:none">Driscoll:1989</span></a> that is optimized to maintain a small number of versions very efficiently. We only need to maintain a few versions, because we refresh to the latest locally available version before the processing of each message.</p>

<p>Sharing Maps connect to the Spine, a distributed service that checkpoints master copies of Maps, facilitates discovery, and routes updates to replicas. The Spine is wrapped as a transactional CAF plugin to handle checkpointing and push changes according to the CAF failure recovery model that we described above. This hides most of the complexity of using Sharing Maps in CA application code. In fact, they just look like local maps. </p>

<p><strong>Sharing Maps use Harmony proxies to implement JSON-serializable methods.</strong></p>

<p>We do not support closures, but the keyword <em>this</em> is properly bound to the Map, allowing a familiar object model. With it we can efficiently replicate both code and data across a distributed system and quickly perform updates that atomically change both. </p>

<p>Moreover, the <em>Isolation</em> property guarantees that it is always safe to call these methods while processing a message, because code changes will respect message processing boundaries. Also, the <em>Fairness</em> property will ensure that eventually all CAs will upgrade. </p>

<p>Let me give you a couple of examples where this is really useful (you can also see the Mutant example):</p>

<ul>
<li><p>Encapsulate data with accessor methods. If the internal structure of the data changes, the accessor methods change accordingly. Since both are atomically changed, you will never have to worry again about data versioning.</p></li>
<li><p>Encapsulate an algorithm with some configuration data. Let&#8217;s say that you want to instrument CAs to spy^H^H^H collect data on your customers. You could encapsulate what you collect and where to send it in a Sharing Map. When you change the algorithm or the service location, CAF will ensure that you always get valid data. Imagine if you could change the algorithm in a safe way to 100M customers in just a few milliseconds, what would you do with that? </p></li>
</ul>

<h2 id="aidsecurityasecurityandlinkedlocalnamespaces"><a id="security"></a>Security and Linked Local Name Spaces</h2>

<p>By the mid&#8211;90s consensus emerged that it was impractical to maintain a world-wide directory that maps meaningful unique names to public keys. An influential paper by Rivest&amp;Lampson <a class="citation" href="#fn:5" title="Jump to citation">[5]<span class="citekey" style="display:none">Rivest:1996</span></a> describing SDSI (Simple Distributed Security Infrastructure) advocated the opposite, manage your own local name space scoped by your public key. Local names are not globally unique but you can make them so by qualifying a local name with a (unique) public key. This enables unambiguous links to other name spaces. </p>

<p>A local name in SDSI resolves to:</p>

<ul>
<li>A public key representing a principal.</li>
<li>A link to a local name in another name space.</li>
<li>A group containing some of the above.</li>
</ul>

<p>If we keep on following those links and expanding groups we ended up with a set of public keys. To authorize a principal to access a resource check whether its public key is in the set, i.e., a local name is an implicit ACL (Access Control List). </p>

<p>Or even better, associate a role with the local name, and use the previous strategy to determine whether a principal has that role. Then, use a compact ACL based on roles to authorize. </p>

<p>Anybody can create a certificate stating what their own local names are bound to. No third-parties are needed to verify this certificate. No more thirty-something trusted root certificate authorities gambling with your security.</p>

<p>This is cool. It didn&#8217;t take off. Why?</p>

<ul>
<li>Users do not want to manage private keys</li>
<li>Finding the certificates that you need to access a resource is complex</li>
</ul>

<p>Let&#8217;s try this again. This time without managing private keys (or certificates)</p>

<h3 id="namingresourcesincaf">Naming resources in CAF</h3>

<p>A user in CAF has a unique, not necessarily meaningful, name, for example:</p>

<ul>
<li>A verified e-mail address using a service like Mozilla Persona</li>
<li>A login name in our Accounts service (unique only in the context of that service)</li>
<li>A string-encoded hash of a public key (advanced users that manage a private key)</li>
</ul>

<p>When this user creates a CA, the name of this CA is always relative to the user&#8217;s name, i.e., it is a local name in the name space scoped by the user&#8217;s name. We use a reserved character &#8216;_&#8217; to create a full name. For example, &#8216;foo@bar.com&#8217; creates CA with local name &#8216;ca1&#8217; and full name &#8216;foo@bar.com_ca1&#8217;.</p>

<p>We use a similar strategy when a user publishes an application. For example,
&#8216;otherfoo@otherbar.com&#8217; publishes the app &#8216;myapp&#8217; with fullname &#8216;otherfoo@otherbar.com_myapp&#8217;.</p>

<p>In most cases we just care about interactions of CAs within the same application (see the introduction). CAF guarantees that full names are unique, and &#8216;foo@bar.com_ca1&#8217; will resolve to at most one CA. </p>

<p>In some cases we need to identify a CA outside its application. Since users can reuse the same local name in different applications, we need to qualify it with the application name. For example, &#8216;otherfoo@otherbar.com_myapp_foo@bar.com_ca1&#8217; represents a CA created by foo@bar.com when using the application published by otherfoo@otherbar.com.</p>

<p>Why is this naming scheme useful? CAF guarantees that a user cannot create objects in any name space but its own. This means that any application called &#8216;otherfoo@otherbar.com_*&#8217; has been published by otherfoo@otherbar.com and any CA named &#8216;foo@bar.com_*&#8217; is owned by foo@bar.com. If I can reliably obtain the name of something I know who is responsible for it.</p>

<p>And in CAF it is really easy to know the real name of something. Interactions between CAs propagate the sender&#8217;s name, and this name is added by security proxies that mediate all interactions. These security proxies are not trusted outside the domain of an application, but help the application writer to implement multi-tenancy for his app. Trust across applications is limited, as we will discuss later on. </p>

<p>From our previous discussion, a Sharing Map has just one CA writer, and this gives us a natural naming scheme for Sharing Maps based on the name of their writers. For example, the Sharing Map &#8216;map1&#8217; that can be written by CA &#8216;foo@bar.com_ca1&#8217; has a full name &#8216;foo@bar.com_ca1_map1&#8217;. </p>

<h3 id="nocertificatesneededincaf">No certificates needed in CAF</h3>

<p>A CA &#8216;speaks for&#8217; <a class="citation" href="#fn:6" title="Jump to citation">[6]<span class="citekey" style="display:none">Lampson:1992</span></a> the user that owns it in the restricted context of this CA&#8217;s application. This means that other CAs in the same app will take actions by this CA as if they were performed directly by the user. </p>

<p>To guarantee the origin of those actions, users can only establish sessions with CAs that they own. As part of establishing a session, a secure channel is created between the user and the CA. Our naming convention for CAs simplify user authentication for this channel: since a CA knows its name, it also knows its owner&#8217;s name. </p>

<p>Since a CA &#8216;speaks for&#8217; its user, when this CA writes into a Sharing Map, the contents of this Map is an statement made by the user (valid only in the context of this application). CAF guarantees the authenticity of a Sharing Map, and readers of (read-only) replicas of that Map will treat that statement as if it were in a certificate signed by the user.</p>

<h3 id="linkingsharingmaps">Linking Sharing Maps</h3>

<p>What all this has to do with SDSI and linked local name spaces?</p>

<p>We use a convention with Sharing Maps used for authorization. Keys in the map represent user names, values could be roles or permissions. We reserve one key for linking and the value of that key is a list containing the names of other Sharing Maps. In that context a Sharing Map is similar to a SDSI group but for convenience we have collected all the links in that group in a list. </p>

<p>To maintain the collection of linked Sharing Maps we use a wrapper data structure called Aggregate. An Aggregate specifies a root map and maintains local replicas of all the maps that are reachable from that root using links. Looking up a key in the Aggregate will return an array containing the values of that key in any of the underlying maps. This makes it very easy to lookup all the roles associated with a user that are defined in any of the maps. </p>

<p>Aggregates are fast. As we discussed, the replication mechanisms of Sharing Maps use shared memory to eliminate duplicates and they could use modern networking hardware more effectively. The lookup performance of a Sharing Map is just a bit slower than a property lookup in an object. Compare that to distributed searches and signature verifications of certificates in SDSI&#8230;</p>

<p>The <em>Atomicity</em>, <em>Isolation</em> and <em>Fairness</em> properties of Sharing Maps also help to make authorization more robust. Policy changes are atomic, they do not occur while we are processing a message, and they eventually propagate everywhere. This is an important issue that any distributed authorization mechanism needs to address or would face failures due to inconsistent transient states, and we are getting a solution for free!</p>

<h3 id="authenticationwithattenuatedtokens">Authentication with attenuated tokens</h3>

<p>Not all CAF applications are equally trusted. When a user authenticates
to its CA in one of this less trusted applications, this CA could launch a
 man-in-the-middle attack impersonating the user in another application (i.e., owned
 by the same user). At this point, the less trusted CA can take control of the
 other CA and start &#8216;speaking for&#8217; the user in the new application. Not good&#8230;</p>

<p>We use attenuated tokens to avoid this problem. A user never authenticates with his own credentials to a CA. It gets redirected first to our &#8216;Accounts&#8217; service and after login in with his credentials it gets a signed token (using the private key of &#8216;Accounts&#8217;). This token can add extra restrictions on when it could be used for authenticating the user: </p>

<ul>
<li>Only before certain time</li>
<li>Only for applications published by X</li>
<li>Only for applications named Y</li>
<li>Only for a CA named Z</li>
</ul>

<p>By adding all these restrictions to a token, a rogue CA will find that the token can only be used to authenticate to itself. </p>

<p>This raises the issue of how to manage all these tokens. We can give a privileged token to a CA in a trusted application, and this CA can negotiate with the Accounts service on our behalf to obtain weaker tokens (or renew expired ones). An example of that is our Website application that implements single sign-on for all the launched applications and renews tokens transparently when needed. </p>

<h2 id="aidinjectionadependencyinjection"><a id="injection"></a>Dependency Injection</h2>

<p>Both a CA and the framework are assembled at run-time from components. What these components are, and how they are configured is described in (JSON) configuration files. We use a simple convention to define the life-cycle of a hierarchy of components, and this makes it easier to add new components that extend the functionality of a CA or the framework itself. </p>

<p>We copied this approach from SmartFrog <a class="citation" href="#fn:7" title="Jump to citation">[7]<span class="citekey" style="display:none">Goldsack:2009</span></a>, a framework written in SmallTalk in the early 90s (and later on rewritten in Java), that used its own description language to specify the behavior of distributed component hierarchies.</p>

<p>We serialize the creation of components but we always use an asynchronous factory method to create them. Creation order follows description declaration order, and by choosing the right order we can enforce component dependencies. At shutdown we reverse that order to ensure no dangling references. </p>

<p>Why an asynchronous constructor if creation order is fixed? </p>

<ul>
<li>To support arbitrary (asynchronous) node.js library calls during component creation</li>
<li>To ensure that we do not &#8220;stop the world&#8221; when we create a new CA</li>
</ul>

<p>But asynchronous constructors are complex. It helps to isolate the bits that really need to be asynchronous, and we use two steps to create a component: first, call a hidden, synchronous constructor that builds the data structures (see files prefixed by &#8216;gen_&#8217;); second, an asynchronous step that makes them live. </p>

<p>Node.js has an amazing package manager (npm) and full support for CommonJS modules. We do not want to reinvent the wheel:</p>

<ul>
<li>Components in CAF are loaded as CommonJS modules, with module names specified in JSON descriptions</li>
<li>Modules export a standard (asynchronous) factory method (&#8216;newInstance&#8217;)</li>
<li>A CAF component also needs to implement a standard shutdown method.</li>
<li>Plugins to services typically have its own (node.js) package. We use a convention to identify the standard modules they need to implement.</li>
</ul>

<p>More details on <a href="gettingstarted.html">Getting Started</a>.</p>

<p>How components find each other? We never use the global JavaScript context. Instead, components register at creation time in a context that we pass as an argument to the factory method. They register with a name specified in the JSON description, and we use conventions to specify those names. For example, the logger component always use the name &#8216;log&#8217;, and any other component can find the &#8216;log&#8217; component in the context, and call the method &#8216;error&#8217; to log an error. </p>

<p>This allow us to swap the implementation of the logger by modifying a JSON config file.</p>

<p>Almost anything in CAF is implemented with a component, and this makes it very easy to change CAF behavior by modifying descriptions. The framework is also under the control of the application writer (as we mentioned, we do not mix applications in one framework process), and it is typically customized with one application in mind. For example, the framework only loads the plugins to services that the application needs, or eliminates &#8216;pulse&#8217; messages when no autonomous CAs are needed.</p>

<p>CAF uses several contexts to register components: A unique framework-level context, and two isolated contexts (internal and handler) per CA. We use the widely adopted JavaScript &#8216;$&#8217; naming convention for context when it is clear what context we are talking about. For example, application code only sees the handler context, and this context only has security proxies that use components in the internal context of the same CA; only one context is visible and it is called &#8216;$&#8217;.
Similarly, inside the framework, since we only have one context to register framework components, we also refer to it as &#8216;$&#8217;. Hopefully, this is not too confusing&#8230;</p>

<div class="footnotes">
<hr />
<ol>

<li id="fn:1" class="citation"><span class="citekey" style="display:none">Armstrong:2007</span><p>Joe Armstrong. <em>Programming Erlang: Software for a Concurrent World</em>. Pragmatic Bookshelf, 2007.</p>
</li>

<li id="fn:2" class="citation"><span class="citekey" style="display:none">Agha:1985</span><p>Gul Agha. <em>ACTORS: A Model of Concurrent Computation in Distributed Systems</em>. PhD thesis, University of Michigan, 1985.</p>
</li>

<li id="fn:3" class="citation"><span class="citekey" style="display:none">Bernstein:1990</span><p>Philip A. Bernstein, Meichun Hsu, and Bruce Mann. <em>Implementing Recoverable Requests Using Queues</em>. In SIGMOD Conference&#8217;90, pages 112&#8211;122,
1990.</p>
</li>

<li id="fn:4" class="citation"><span class="citekey" style="display:none">Driscoll:1989</span><p>J.R. Driscoll, N. Sarnak, D.D. Sleator, and R.E. Tarjan. <em>Making data structures persistent</em>. Journal of computer and system sciences, 38(1):86&#8211;124, 1989.
http://www.amazon.com/Douglas-Crockford/e/B002N3VYB6/ref=ntt_athr_dp_pel_1</p>
</li>

<li id="fn:5" class="citation"><span class="citekey" style="display:none">Rivest:1996</span><p>Ronald L. Rivest and Butler Lampson. <em>SDSI &#8211;A Simple Distributed Security Infrastructure</em>. Presented at CRYPTO&#8217;96.</p>
</li>

<li id="fn:6" class="citation"><span class="citekey" style="display:none">Lampson:1992</span><p>B. Lampson, M. Abadi, M. Burrows, and E. Wobber. <em>Authentication in Distributed Systems: Theory and Practice</em>. ACM Transactions on Computer Systems (TOCS), 10(4):265&#8211;310, 1992.</p>
</li>

<li id="fn:7" class="citation"><span class="citekey" style="display:none">Goldsack:2009</span><p>Patrick Goldsack, Julio Guijarro, Steve Loughran, Alistair Coles, Andrew Farrell, Antonio Lain, Paul Murray, and Peter Toft. <em>The SmartFrog Configuration Management Framework</em>. SIGOPS Oper. Syst. Rev., 43(1):16&#8211;25, 2009.</p>
</li>

</ol>
</div>

