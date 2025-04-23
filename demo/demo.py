from flask import Flask, render_template
from os import chdir, getcwd
from os.path import realpath, dirname, join

# Set current path as working dir
chdir(dirname(realpath(__file__)))

# Init Flask app
app = Flask(__name__, template_folder=join(getcwd(),"templates"), static_folder=join(getcwd(),"static"))

# Home
@app.route("/")
def root():
    return render_template("root.html")

# Demo
@app.route("/demo")
def demo():
    return render_template("demo.html")

# Buyer
@app.route("/buyer")
def buyer():
    return render_template("buyer.html")

# Buyer
@app.route("/buyer-orders")
def buyer_orders():
    return render_template("buyer-orders.html")

# Seller
@app.route("/seller-orders")
def seller_orders():
    return render_template("seller-orders.html")

# Run server
app.run()