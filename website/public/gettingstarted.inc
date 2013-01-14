<h1 id="aidtopagettingstarted"><a id="top"></a>Getting started</h1>

<p>By the end of this tutorial you should be able to:</p>

<ul>
<li>Write a simple CA that maintains its own state, exports public methods that
can be called by the client, and implements life-cycle methods that are called
by the framework</li>
<li>Add autonomous behavior with the &#8216;pulse&#8217; framework method</li>
<li>Understand how your GUI interacts with it</li>
<li>Add the ability to asynchronously send notifications to your client</li>
<li>Manage these notifications by using logical sessions and direct manipulation of output queues</li>
<li>Add a service to facilitate interactions between CAs</li>
</ul>

<p>We use a simple counter example (pun intended) to introduce these concepts. The CA&#8217;s state is just a number representing the counter. </p>

<p>As you make your way through this tour of the CAF, we demonstrate how you can:</p>

<ul>
<li>initialize the counter and export methods that the client can use to read or increment its value</li>
<li>limit the number of pending notifications or choose which client device (or all) should receive a notification</li>
</ul>

<p>In addition, we&#8217;ll show you how you can get CAs to do some useful things:</p>

<ul>
<li>periodically increment counters on their own</li>
<li>notify clients when their counter reaches a multiple of 5 (or of another value)</li>
<li>tell each other that they have reached certain value by using a (pub/sub) service</li>
</ul>

<p>For our examples we put together a bare-bones GUI using Enyo. If the GUI looks ugly blame us not Enyo! Please also take note that this is not a tutorial about Enyo (see http://enyojs.com) and it should be easy to adapt the same ideas to other client frameworks.</p>

<h2 id="beforewestart">Before we start</h2>

<p>Source code for the examples is in github &lt;http://&gt;</p>

<p>We follow a standard node.js package layout, and we add a <code>/public</code> dir that contains the client app. Also, in the <code>/lib</code> dir
there is always a file called <code>ca_methods.js</code> that implements the CA.
By default, the framework looks for this file name to bootstrap the system. Please do not rename that file. </p>

<p>Another two files (also in <code>/lib</code>) that will soon be familiar to you are <code>ca.json</code> and <code>framework.json</code>. They define how to configure a CA and how to configure the framework. </p>

<p>File <code>rsa_pub.pem</code> contains the public key of the Accounts service. This service issues signed authentication tokens that enable single sign-on for your app.</p>

<p>The behavior of the Enyo-based GUI is defined by <code>App.js</code> in <code>/public/source</code>.</p>

<p>All the tutorial examples are already deployed and you can use the launcher to see what they do. We call them tutorial1a, tutorial1b, tutorial1c&#8230;No, we don&#8217;t have an tutorial2, but it&#8217;s good to plan for the future.</p>

<p>But the fun part is when you start tinkering with them. To see the results, you&#8217;ll need to use Turtles, our deployment app. Simply create a tar file with the app and its dependencies (the script ./cpexample <code>&lt;appname&gt;</code> should do that for you by creating a tar file in /tmp/&#8230;). Then, leave that tar file where Turtles can see it (a public url hosted by a service like HP Object Storage, a public folder in Dropbox, or your website outside the firewall - just making sure that this website can give you ETag header info), give it a name, and Turtles will do the rest. If you toggle the setting to Auto, Turtles tracks changes to the contents of the url and asks you to upgrade when needed. </p>

<p>We don&#8217;t have debugging support in Turtles right now, and if you get stuck you may want to run everything locally first, <a href="standalone.html">Running CAF Locally</a> where you can use standard node.js debugging tools like <a href="https://github.com/dannycoates/node-inspector">node-inspector</a>. </p>

<h2 id="aidbasicsatutorial1athebasics"><a id="basics"></a>Tutorial 1a) The basics</h2>

<ul>
<li>initializing a CA</li>
<li>defining framework methods</li>
<li>calling public methods from your client</li>
<li>modifying internal CA state</li>
</ul>

<p>Let&#8217;s look at file lib/ca_methods.js. This is the main file that defines the behavior of the CA and starts the framework. </p>

<p>It is just a node.js file that loads the core module:</p>

<pre><code>var caf = require('caf_core');
</code></pre>

<p>exports a bunch of methods:</p>

<pre><code>exports.methods = {
          ....
}
</code></pre>

<p>and starts the framework:</p>

<pre><code>caf.init(__dirname, {});
</code></pre>

<p>Methods are exported with an object that can <em>only</em> contain plain functions, which means you cannot use closures or other object variables. </p>

<p>We follow a simple naming convention; the prefix <code>__ca_</code> indicates a framework method that can only be called by the framework, otherwise it&#8217;s a public method (typically called by the remote client app).</p>

<h3 id="callbacks">Callbacks</h3>

<p>Both framework and public methods use a standard callback convention and in good node.js tradition take two arguments <code>cb(err, data)</code> . When the first argument <code>err</code> is falsy it means everything went fine and the result is in <code>data</code>. Otherwise, we get an error condition as described by <code>err</code>:</p>

<pre><code>'increment' : function(..., cb) {    
  cb(err, data);
}
</code></pre>

<p>Ok, but where does <code>cb</code> come from and why do we need it? </p>

<p>The framework creates a fresh <code>cb</code> for each call and it is just a way for your code to tell the framework &#8220;I&#8217;m done processing this request, this is what happened with it, give me the next one&#8221;. </p>

<p>We cannot just &#8216;return&#8217; like a normal function because this is node.js, and we may want to do multiple non-blocking operations before we are actually ready to process the next request. If you want to know more about Actors, and the rationale behind all this, see <a href="framework.html">CAF Design</a>.</p>

<p>A common bug is to return without calling <code>cb</code>. In that case the CA hangs until the cron ripper detects that condition and shuts it down.</p>

<h3 id="state">State</h3>

<p>How do you add state to your CA if you cannot use closures or object variables in the <code>methods</code> object?</p>

<p>Whenever the framework creates a new CA it starts with an empty object, adds all the methods in <code>methods</code> and creates in it an empty object <code>this.state</code>. This object contains anything you want as long as it is JSON serializable. </p>

<p>We need JSON serializable contents because the framework regularly checkpoints <code>this.state</code> in a remote server.</p>

<h3 id="frameworkmethods">Framework methods</h3>

<p>Two framework methods that typically change <code>this.state</code> are: </p>

<pre><code>'__ca_init__' : function(cb) {
    this.state.counter = -1;
    cb(null);
},
'__ca_resume__' : function(cp, cb) {
    this.state = (cp &amp;&amp; cp.state) || {};
    cb(null);
},
</code></pre>

<p>where <code>__ca_init__</code> is only called once in the lifetime of a CA, and gives your code a chance to do a first initialization.</p>

<p><code>__ca_resume__</code> is called by the framework many times. For example, when updating the code that implements this CA, or when migrating this CA to a different server, or when restarting immediately after a crash. </p>

<p><code>__ca_resume__</code> takes an argument <code>cp</code> that reflects the last checkpoint of <code>this.state</code>. We guarantee that <code>cp</code> is really the last one, since nobody has been able to observe a more recent state&#8211;we always checkpoint before externalizing state. </p>

<p>Note how we call the callback <code>cb</code> with a falsy (i.e., <code>null</code>) argument to indicate that everything went fine. </p>

<h3 id="publicmethods">Public methods</h3>

<p>Public methods follow the same structure:</p>

<pre><code>'increment' :function(inc, cb)  {
    this.state.counter = this.state.counter + inc;
    cb(null, {counter : this.state.counter});    
}
</code></pre>

<p>Here the argument <code>inc</code> is provided by the client. Since the first argument in the callback is <code>null</code> we return the object <code>{counter : this.state.counter}</code> to the caller&#8211;don&#8217;t forget it also should be JSON serializable, since it goes over the network.</p>

<h3 id="errors">Errors</h3>

<p>The CA is designed to start up once, keep running indefinitely, and always maintain the last exposed state. To accomplish this, we have designed it so that changes to <code>this.state</code> are transactional. The transaction starts with the method invocation and finishes with the end of the callback. Errors simply abort the transaction. For example:</p>

<pre><code>'increment' :function(inc, cb)  {
    this.state.counter = this.state.counter + inc;
    if (some error condition) {
        cb(&quot;got error&quot;);    
    } else {
        ...
    }
}
</code></pre>

<p>Even though we have modified the counter, the framework forgets about those changes when there is an error, and both the checkpoint and the next request will see the old value of the counter. The &#8220;got error&#8221; string will be returned with an application-level error to the client, as we will see next.</p>

<p>What about exceptions?</p>

<p>Exceptions also rollback changes, but they are assumed to be a programming error, and your client will get a system error (exceptionThrown). Do <strong>not</strong> throw exceptions to propagate application errors.</p>

<h3 id="client">Client</h3>

<p>The main Enyo app file is in <code>public/source/App.js</code>. You could also use a <code>node.js</code> client (see <code>caf_lib/caf_cli</code>) and a jQuery plugin will be next. The user interface for this example should be very simple, let&#8217;s look at the CA-specific bits: </p>

<pre><code>{kind: &quot;ca.LoginContext&quot;, name : &quot;login&quot;, onSession : &quot;newSession&quot;},
...
  {kind: &quot;onyx.Button&quot;, name : &quot;myButton&quot;, content: &quot;inc&quot;, ontap: &quot;callCA&quot;},
...
newSession: function(inSource, inEvent) {
    this.mySession = inEvent.session;
    return true;
},
...
callCA: function(inSource, inEvent) {
    var self = this;
    var cbOK = function(msg) {
        self.$.lastcall.setContent(JSON.stringify(msg));
    };
    var cbError = function(error) {
        self.$.lastcall.setContent('ERROR:' + JSON.stringify(error));
    };
    this.mySession &amp;&amp; this.mySession.remoteInvoke('increment',[1],
                                                   cbOK, cbError);
    return true;
},
</code></pre>

<p>We first create a LoginContext that will negotiate a session with the CA (see file <code>caf_core/public/source/util/LoginContext.js</code> for details). When we have a new session the event <code>onSession</code> triggers the handler method <code>newSession</code>, which registers the session. At any time we can tap on the button <code>inc</code> to call method <code>callCA</code>, and this method will invoke the method <code>increment</code> in the remote CA with argument <code>1</code>. When the CA responds either one of the callbacks will be called (error or last counter value) changing the display accordingly. </p>

<h2 id="aidpulseatutorial1baddingautonomousbehaviorwithpulse"><a id="pulse"></a>Tutorial 1b) Adding autonomous behavior with pulse</h2>

<p>We would like to guarantee that a CA increments its counter regularly. Even if nobody is calling its public methods.</p>

<p>We can easily do that by providing a <code>__ca_pulse__</code> framework method:</p>

<pre><code>'__ca_pulse__' : function(cb) {
    this.state.counter = this.state.counter + 1;
    cb(null);
}
</code></pre>

<p>CAF periodically calls that method for each CA. </p>

<h3 id="configuration">Configuration</h3>

<p>How often does the framework call the CA? </p>

<p>We can configure it, like almost any other property in the framework, by modifying the file <code>lib/framework.json</code>. In particular, if we want a call every 3 seconds, simply set the interval property to 3: </p>

<pre><code>{
    &quot;module&quot;: &quot;cron_pulser&quot;,
    &quot;name&quot;: &quot;pulser&quot;,
    &quot;description&quot;: &quot;Cron job for enabling autonomous computation of CAs&quot;,
        &quot;env&quot;: {
            &quot;interval&quot; : 3 
        }
    }
}
</code></pre>

<p>This configuration file may look a bit cryptic but it should not be. The framework is built from components, and each component has four important attributes: </p>

<ul>
<li><code>&quot;module&quot;</code> specifies the code that implements that component, we use standard node.js modules, so you could think of this as the string you would pass to a <code>require()</code> call to load a module (not exactly, see below for details)</li>
<li><code>&quot;name&quot;</code> the identifier in the framework-level context that this component will get after creation. Components are not tightly bound to each other, they look themselves up in the context before invoking methods on each other. We use conventions of what the <code>&quot;name&quot;</code> of a particular component should be and this makes it easier to swap implementations. In fact, you could change the implementation of almost anything by modifying <code>lib/framework.json</code>.</li>
<li><code>&quot;description&quot;</code> JSON does not support comments so it is handy to have a placeholder for them. They are also visible at run-time and this could make error reporting a bit cleaner.</li>
<li><code>&quot;env&quot;</code> a bunch of properties that are passed to the component at creation time. By convention, all crons (components performing regular tasks) use the identifier <code>&quot;interval&quot;</code> to define time in seconds between actions.</li>
</ul>

<p>Similar to the framework, a CA is built from pluggable components. The config file <code>lib/ca.json</code> plays the same role as <code>lib/framework.json</code>, but for a single CA.</p>

<h4 id="defaultconfiguration">Default configuration</h4>

<p>Example 1a did not define an <code>&quot;interval&quot;</code> property in <code>lib/framework.json</code> for <code>cron_pulser</code>, so it inherits the framework default value.</p>

<p>Where is the default value for <code>&quot;interval&quot;</code> defined?</p>

<p>Components in <code>lib/framework.json</code> nest. In the code, at the top level, you see a <code>&quot;sup&quot;</code> component with an <code>env</code> that sets interval to 5. If a child component does not define its own <code>interval</code> it gets its parent. </p>

<p>When we start the framework we pass two arguments, the first one sets a default directory for <code>*.json</code> config files (<code>__dirname</code> is set by node.js to the directory containing the <code>lib/ca_methods.js</code> file). The second argument passes an object with properties that will first overwrite <code>&quot;sup&quot;</code>&#8217;s <code>&quot;env&quot;</code>. This is convenient for passing environment properties at run-time. </p>

<p>For example, a child component of <code>&quot;sup&quot;</code> that does not define its own <code>&quot;interval&quot;</code> will get a value 7:</p>

<pre><code>caf.init(__dirname, {&quot;interval&quot;: 7});
</code></pre>

<h2 id="aidnotifatutorial1casynchronousclientnotifications"><a id="notif"></a>Tutorial 1c) Asynchronous client notifications</h2>

<p>Autonomous behavior is useful but it is better when we can notify the client that something happened as a result of that autonomous computation, and it is even more useful if that notification is buffered in the cloud until the client is ready to see it.</p>

<p>We use a simple example to illustrate this. When the counter is multiple of 5 we will notify the client of that event. The modified code for <code>__ca_pulse_</code> is below, changes for the <code>increment</code> method are similar:</p>

<pre><code>'__ca_pulse__' : function(cb) {
    this.state.counter = this.state.counter + 1;
    if (this.state.counter % 5 == 0) {
        this.$.session.notify([this.state.counter], 'default');
    }
    cb(null);
}
</code></pre>

<h3 id="this.">this.$</h3>

<p>We try to make it really easy to safely support multi-tenancy in your application, and one way to do that is by restricting visibility to the framework internals. </p>

<p>When the CA is created, <code>this.$</code> gets populated with proxies to all the services accessible from your methods. Proxies add authenticated client information to all requests, making it easier to enforce separation.</p>

<p>The contents of <code>this.$</code> are whatever it says in <code>lib/ca.json</code>. For example, to send notifications we need a proxy to the session service of this CA:</p>

<pre><code>&quot;proxies&quot; : [
      ....
      {
        &quot;module&quot;: &quot;caf_session/proxy&quot;,
        &quot;name&quot;: &quot;session&quot;,
        &quot;description&quot;: &quot;Provides information of the session of this incoming request&quot;,
        &quot;env&quot; : {

        }
    },
    ...
]
</code></pre>

<p>Take a look at the core file <code>proxy_session.js</code> in <code>caf_lib/caf_session/lib</code>, and you can see that it exports a method <code>notify(argsArray, sessionId)</code>, which queues a notification containing an array with arguments, and this notification is delivered within the specified <code>default</code> logical session. You can find details about logical sessions in Tutorial 1d.</p>

<h3 id="errors">Errors</h3>

<p>What happens if we return an error after calling the method <code>notify</code>? </p>

<p>The session service is transactional. Since it participates in the overall method transaction, it aborts too (think two-phase commit), so the notification gets ignored. </p>

<p>The ability to add more (local) services participating in the transaction by modifying <code>lib/ca.json</code> is one of the most powerful features of the framework. Transactional services piggyback on the checkpoint mechanism to ensure durability, so we do not use distributed transactions in case you are wondering&#8230; </p>

<h3 id="client">Client</h3>

<p>When it receives a notification from the CA, the client code emits an (Enyo) event. </p>

<p>For example:</p>

<pre><code>{kind: &quot;ca.LoginContext&quot;, name : &quot;login&quot;, onSession : &quot;newSession&quot;,
    onNotification: &quot;newNotif&quot; },
 ...     
 newNotif: function(inSource, inEvent) {
     var counter = inEvent[0];
     this.$.notification.setValue(&quot; got counter &quot; + counter);
     return true;
 }
</code></pre>

<p>Event <code>onNotification</code> is handled by method <code>newNotif</code> that extracts the counter from the array of arguments in the notification, and changes the display.</p>

<p>Note that <code>LoginContext</code> above does not specify a logical session, and it will default to one named <code>default</code>, matching the name used by the CA.</p>

<h2 id="aidlogicalatutorial1dmanagingclientnotifications"><a id="logical"></a>Tutorial 1d) Managing client notifications</h2>

<p>The previous example had two serious issues: </p>

<ul>
<li>the logical session <code>default</code> could be shared by several client devices active at the same time, and each notification will only appear in one of them, picked at random</li>
<li>when no clients are active the CA queues notifications until it runs out of memory</li>
</ul>

<p>In order to fix these problems we allow a CA to have multiple independent logical sessions, and also allow your code access to the output queues associated with them. </p>

<h3 id="logicalsessions">Logical sessions</h3>

<p>A client chooses any name for a session with its CA. This name can be shared by multiple clients. All the sessions with a CA using the same name form a logical session. A CA views a logical session as a named output queue from which any client using a session with the same name can dequeue notifications.</p>

<p>This gives you flexibility on how to deliver notifications to clients. You can associate a different logical session to each device; and then the CA can choose the device that will receive the notification, or send the same notification to all of them.</p>

<p>For example:</p>

<pre><code>var DIVIDER = 5;
var notifyAll = function(self) {    
    if (self.state.counter % DIVIDER === 0) {
        for (var sessionId in self.state.logicalSessions) {
            self.$.session.notify([self.state.counter], sessionId);
        }
    }
};
...
'__ca_pulse__' : function(cb) {
    this.state.counter = this.state.counter + 1;
    notifyAll(this);
    cb(null);
}
</code></pre>

<p>Here we just maintain an object with the logical sessions to which we want to send notifications, and we repeat the <code>notify</code> operation for each one. </p>

<p>As an optimization, we can track logical sessions that have been active recently and just notify those. We do that by querying the active logical session inside the <code>increment</code> method and use this info to populate a small LRU (Least Recently Used) cache from which the set of logical sessions is derived. See <code>ca_methods.js</code> for details.</p>

<p>The client code specifies the name of the session by using the <code>sessionId</code> property:</p>

<pre><code>this.createComponent({kind: &quot;ca.LoginContext&quot;, 
                      name : &quot;login&quot;, sessionId :this.getSessionId(),
                      onSession : &quot;newSession&quot;,
                      onNotification: &quot;newNotif&quot; }),
</code></pre>

<p>and we dynamically create the <code>LoginContext</code> because we need to wait for the user typing the session name.</p>

<h3 id="outputqueues">Output queues</h3>

<p>We need to limit the size of output queues to avoid running out of memory. The best strategy is very dependent on the application. A CA can ignore a new notification based on its output queues&#8217; contents; or it can make room by dropping older notifications.</p>

<p>For example, let&#8217;s ensure that the queue has no more than 10 notifications (the most recent ones):</p>

<pre><code>var DIVIDER = 5;
var MAX_NUM_NOTIF = 10;
var notifyAll = function(self) {    
    if (self.state.counter % DIVIDER === 0) {
        for (var sessionId in self.state.logicalSessions) {
             self.$.session.boundQueue(MAX_NUM_NOTIF, sessionId);
             self.$.session.notify([self.state.counter], sessionId);
        }
    }
};
</code></pre>

<p>The <code>boundQueue</code> method takes two arguments:</p>

<ul>
<li>the minimum number of notifications that, if available, we should leave in the queue after dequeuing</li>
<li>the session name</li>
</ul>

<p>Another useful method in <code>this.$.session</code> is <code>outq(sessionId)</code>; <code>outq</code> gives you a read-only snapshot of the output queue (using an array-like data structure). </p>

<p>Note that changes to output queues are not serialized with respect to CA method invocations, and we should not rely on the output queue staying the same by the time we commit method changes. That&#8217;s why <code>outq</code> returns a read-only snapshot and we need the method <code>boundQueue</code> to modify the queue. </p>

<h2 id="aidserviceatutorial1eenablinginteractionsbetweencaswithaservice"><a id="service"></a>Tutorial 1e) Enabling interactions between CAs with a service</h2>

<p>A CA is a light-weight proxy and whenever it feels like it is doing too much, you should think about off-loading the work to a service and using a plugin for access. In the directory <code>caf_extra</code> we have a few plugins that enable CA interaction with services. </p>

<p>Once the plugin has been written, using it is easy. However, writing plug-ins can become complex, especially when they need to preserve transaction semantics. At the time of this writing CAF internals are still unstable, which doesn&#8217;t help. We do not want to discourage you from giving it a try, but you have been warned! </p>

<p>Most plugins have three components: </p>

<ul>
<li>a proxy that will be visible to your code in <code>this.$</code>,</li>
<li>a hidden component associated with a CA, usually stateful, that we call <code>plug_ca</code>,</li>
<li>and a framework-level component, usually stateless, that multiplexes all the interactions of the local <code>plug_ca</code> components in a few connections to the service (<code>plug</code>).</li>
</ul>

<p>In this example we use Redis (http://redis.io) underneath to implement a publish-subscribe messaging abstraction that allows CAs to inform each other when their counters reach specified thresholds. Our plugin will have:</p>

<ul>
<li>a proxy called <code>pubsub</code> where you&#8217;ll find the publish and subscribe methods for the CA,</li>
<li>a <code>plug_ca</code> that maintains the list of channels to which your CA is subscribed,</li>
<li>and a <code>plug</code> that keeps alive a few connections to the Redis server to support all the local channels.</li>
</ul>

<p>In order to use the publish-subscribe service we have to add the <code>plug</code> to <code>framework.json</code> (since it is a framework-level component) and both <code>plug_ca</code> and the proxy to <code>ca.json</code> (you get new ones when you create a CA).</p>

<pre><code>// in framework.json inside &quot;plugs&quot;
{
    &quot;module&quot;: &quot;caf_pubsub/plug&quot;,
    &quot;name&quot;: &quot;pubsub_mux&quot;,
    &quot;description&quot;: &quot;Shared connection to a pub/sub service \n Properties: \n&quot;,
    &quot;env&quot;: {
    }
 },     

// in ca.json inside &quot;internal&quot;
{
    &quot;module&quot;: &quot;caf_pubsub/plug_ca&quot;,
    &quot;name&quot;: &quot;pubsub_ca&quot;,
    &quot;description&quot;: &quot;Provides a publish/subscription service for this CA&quot;,
    &quot;env&quot; : {
    }
},

// in ca.json inside &quot;proxies&quot;
{
        &quot;module&quot;: &quot;caf_pubsub/proxy&quot;,
        &quot;name&quot;: &quot;pubsub&quot;,
        &quot;description&quot;: &quot;Access to a publish subscribe service\n Properties:\n &lt;insecureChannelPrefix&gt; Name prefix for channels that are not authenticated.\n&quot;,
        &quot;env&quot; : {
            &quot;insecureChannelPrefix&quot; : &quot;anybody/&quot;
        }
    },
},
</code></pre>

<p>We use a hierarchical notation for the <code>module</code> because we wrap the three components into a single node.js package (<code>caf_pubsub</code>). By convention, a package that implements a plugin exports <code>plug</code>, <code>plug_ca</code> and <code>proxy</code> methods with its corresponding modules.</p>

<p>By default the plug-in <code>caf_pubsub</code> only allows a CA to publish on channels with names prefixed by its own identifier, and this helps to support multi-tenancy safely. To override this behavior we reserve a channel prefix for non-authenticated channels, i.e., <code>insecureChannelPrefix</code>.</p>

<pre><code>var CHANNEL_NAME = &quot;anybody/tutorial1e:counterchannel&quot;;
...
&quot;__ca_init__&quot; : function(cb) {
    this.state.counter = -1;
    this.state.finished = {};
    this.$.pubsub.subscribe(CHANNEL_NAME, &quot;thresholdHandler&quot;);
    cb(null);
},

'__ca_pulse__' : function(cb) {
    this.state.counter = this.state.counter + 1;
    if (this.state.counter &gt;= MAX_COUNTER) {
        this.$.pubsub.publish(CHANNEL_NAME, this.$.session.getMyId());
    }

    var nFinished = Object.keys(this.state.finished).length;
    if (nFinished &gt;= MAX_FINISHED) {
        this.$.session.notify([nFinished], 'default');
    }
    cb(null);
}, 

//handler method
&quot;thresholdHandler&quot; : function(channel, id, cb) {
    this.state.finished[id] = true;
    cb(null);
},
</code></pre>

<p>In the example above, each CA subscribes to the same non-authenticated channel. When a counter reaches a specified threshold, its CA publishes this event using its unique CA identifier. Then, each CA gets to see this event and updates its own set of the CAs that have reached the threshold. To take care of the fact that publishing an event is a best-effort operation, CAs that have reached the threshold regularly re-announce that fact. </p>

<p>When a CA learns that a pre-specified number of CAs have reached the threshold, it queues a notification to its own client. </p>

<p>The method <code>subscribe(channel, methodHandler)</code> informs the plugin of the method in this CA that handles a published message. Internally, the plugin translates a Redis/node.js event into a local message that will invoke that same method. </p>

<p>This allows us to continue processing requests while ensuring that asynchronous event handlers <strong>don&#8217;t</strong> create race conditions. The execution of the handler method is serialized with respect to other requests because the CA treats events like any other request. </p>

<p>As we discussed in <a href="framework.html">CAF Design</a>, do not try to handle node.js events directly in your methods, instead you should enforce serialization of handlers with an actor (i.e., a CA) to keep sane. </p>
