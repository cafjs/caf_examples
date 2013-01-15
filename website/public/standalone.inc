<h1 id="runningcaflocallywithoutcloudfoundry">Running CAF locally without Cloud Foundry</h1>

<p>We do not have debugging support in <em>turtles</em> yet and the recommended way to develop CAF apps is to run them in a local environment first. </p>

<h2 id="pre-requisites">Pre-requisites</h2>

<p>We use Linux. Apple OS X should be similar enough. No experience with Microsoft Windows. </p>

<p>Install redis &gt;=2.6 (see http://redis.io/). We use Lua scripting in Redis and 2.4 will not work. It is likely that you will need to install from source because most Linux distributions do no support 2.6 yet. </p>

<p>In redis.conf set &#8216;daemonize yes&#8217; and &#8216;requirepass pleasechange&#8217; or whatever password you will use for redis.</p>

<p>Install node.js &gt;= 0.8.1 (see http://nodejs.org). Create an alias in your .bashrc: </p>

<pre><code>alias node='node --harmony-proxies'
</code></pre>

<p>so that node will always enable harmony proxies.</p>

<p>If needed, change dir permissions to ensure that <code>npm link</code> can write in <code>{prefix}/lib/node_modules</code> (<code>{prefix}</code> is typically <code>/usr/local</code>).</p>

<p>To debug CAF install <code>node-inspector</code> ( see https://github.com/dannycoates/node-inspector )</p>

<p>Clone <code>caf</code> from github (in https://github.com/cafjs/caf). Initialize submodules:</p>

<pre><code>git clone  https://github.com/cafjs/caf.git
cd caf
git submodule update --init --recursive
</code></pre>

<h2 id="startingacloudfoundryhttproutersimulator">Starting a Cloud Foundry http router simulator</h2>

<p>The simulator is in <code>caf_extra/caf_sim</code>. It is just 30 lines of <code>node.js</code> that uses the fantastic <code>http-proxy</code> package to create a local proxy that redirects http traffic and mangles cookies. To start it:</p>

<pre><code>caf_extra/caf_sim/start.js 4000 localhost 3000
</code></pre>

<p>where <code>4000</code> is the new local port, <code>localhost</code> is where your CAF server will run, and <code>3000</code> is the port that this server is listening to (defaults to 3000 but it can be changed in framework.json as follows)</p>

<pre><code>  {
        &quot;module&quot;: &quot;plug_cloudfoundry&quot;,
        &quot;name&quot;: &quot;cf&quot;,
        &quot;description&quot;: &quot;Enables access to config properties provided by Cloud Foundry&quot;,
        &quot;env&quot;: {
            &quot;port&quot; : 3001
        }
    },
</code></pre>

<h2 id="preparingyourappforlocalexecution">Preparing your app for local execution</h2>

<p>You need to configure <code>framework.json</code> in your app so that it uses the local Redis service:</p>

<pre><code>   {
        &quot;module&quot;: &quot;plug_cloudfoundry&quot;,
        &quot;name&quot;: &quot;cf&quot;,
        &quot;description&quot;: &quot;Enables access to config properties provided by Cloud Foundry&quot;,
        &quot;env&quot;: {
            &quot;redis&quot; : {
                &quot;hostname&quot; : &quot;localhost&quot;,
                &quot;port&quot; : 6379,
                &quot;password&quot; : &quot;pleasechange&quot;
            }
        }
    },
</code></pre>

<p>Then, set up the environment:</p>

<pre><code>tools/setupLinks.sh
</code></pre>

<p>and package your app (assumed in the <code>caf_examples</code> dir):</p>

<pre><code>tools/cpexample.sh helloworld
</code></pre>

<p>This creates a directory <code>/tmp/helloworld</code> with your app+dependencies (and a tarball <code>/tmp/helloworld.tgz</code> if you want to deploy remotely with <code>turtles</code>). </p>

<h2 id="runningyourapplocally">Running your app locally</h2>

<p>Assuming that the simulator and Redis are already running, just type:</p>

<pre><code>cd /tmp/helloworld; node index.js
</code></pre>

<p>The server should be up now. Type the following url in a browser:</p>

<pre><code>http://helloworld.vcap.me:4000/app.html
</code></pre>

<p>and after logging in using the <code>accounts</code> service (serviceUrl location in <code>framework.json</code>) you should see the app in your browser.</p>

<p>Note that the domain <code>*.vcap.me</code> always resolves to your localhost, and we need it to avoid (browser) caching problems created by using <code>http://localhost:4000/app.html</code> with different applications.</p>

<h2 id="debuggingyourapp">Debugging your app</h2>

<p>The first step is to increase the logger output. For example, to set the logger to <code>TRACE</code> mode, change in <code>framework.json</code>:</p>

<pre><code>{
    &quot;module&quot;: &quot;plug_log&quot;,
    &quot;name&quot;: &quot;log&quot;,
    &quot;description&quot;: &quot;Logging of errors and debugging info\n Properties: &lt;logLevel&gt; Threshold for logging: OFF, FATAL, ERROR, WARN, INFO, DEBUG and TRACE (in that order).&quot;,
    &quot;env&quot;: {
        &quot;logLevel&quot; : &quot;TRACE&quot;
    }
},
</code></pre>

<p>It also helps to create a client session with Redis and lookup the internal state of CAs or monitor CAF updates:</p>

<pre><code>redis-cli -a pleasechange
keys *
mget data:antonio_m1
monitor
</code></pre>

<p>But in most cases it is best to use two debuggers: one to set breakpoints in the client (using the browser&#8217;s debugger) and the other one attached to CA code (i.e., using <code>node-inspector</code>). This allows you to examine the state of the system as you follow requests from client to CA and back. To do that, first start CAF server in debug mode:</p>

<pre><code>{
    &quot;module&quot;: &quot;sup_main&quot;,
    &quot;name&quot;: &quot;sup&quot;,
    &quot;description&quot;: &quot;Top level Supervisor component...&quot;,        
    &quot;env&quot;: {
        &quot;debugger&quot;: true
        ...
</code></pre>

<p>Then, start node-inspector:</p>

<pre><code>.bin/node-inspector
</code></pre>

<p>and use a browser to attach to that process using the URL:</p>

<pre><code>http://0.0.0.0:8080/debug?port=5858
</code></pre>

<p>and now you can use a separate browser window to load the app and set breakpoints in the client code.</p>
